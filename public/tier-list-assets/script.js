// Initial crypto coins - empty by default, users add via categories or search
const defaultCoins = [];

// X handle that receives portfolio submissions (no @)
const REVIEWER_X_HANDLE = 'jesusmartinez';

// Canonical home of the site. share links must always point here, never at
// localhost or a preview deployment
const CANONICAL_ORIGIN = 'https://www.martinezaccess.com/tier-list';

let coins = [...defaultCoins];
let viewMode = 'builder'; // 'builder' | 'review' (submission link) | 'verdict' (published link)
let draggedElement = null;
let customCoinData = {}; // Store custom coin metadata (logo URLs, etc.)
let lastRemovedCoin = null; // Store last removed coin for undo
let undoTimeout = null;
let currentCategory = 'none'; // Track active category tab (My Portfolio by default)
let categoryCache = {}; // Cache fetched category data

// ============================================
// SECURITY: Input Sanitization Utilities
// ============================================

// Sanitize coin names - allow only alphanumeric, spaces, hyphens, dots, underscores
function sanitizeCoinName(name) {
    if (typeof name !== 'string') return '';
    return name.replace(/[^a-zA-Z0-9\s\-_.]/g, '').trim().substring(0, 20);
}

// Validate and sanitize URLs - only allow trusted domains
function sanitizeLogoUrl(url) {
    if (typeof url !== 'string') return '';
    const allowedDomains = [
        'coingecko.com',
        'assets.coingecko.com',
        'coin-images.coingecko.com',
        'coinmarketcap.com',
        's2.coinmarketcap.com'
    ];
    try {
        const parsed = new URL(url);
        if (parsed.protocol === 'https:' &&
            allowedDomains.some(domain => (parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)))) {
            return url;
        }
    } catch (e) {
        // Invalid URL
    }
    return '';
}

// Validate tier names
function isValidTierName(tier) {
    return ['S', 'A', 'B', 'C', 'D', 'F'].includes(tier);
}

// Single source of truth for tier letters, verdict labels, and export colors.
// Names must stay ≤12 chars (the editable tier-name input cap).
const TIER_LABELS = {
    S: { letter: 'S', degenLetter: '100X', name: 'GENERATIONAL', degenName: 'NEVER SELL', color: '#22c55e', emoji: '🔥' },
    A: { letter: 'A', degenLetter: '75X', name: 'STRONG BAG', degenName: 'SEND IT', color: '#84cc16', emoji: '💎' },
    B: { letter: 'B', degenLetter: '50X', name: 'SOLID', degenName: 'HODL', color: '#eab308', emoji: '📈' },
    C: { letter: 'C', degenLetter: '25X', name: 'RETHINK', degenName: 'COPE', color: '#f97316', emoji: '📊' },
    D: { letter: 'D', degenLetter: '10X', name: 'TRIM IT', degenName: 'DOWN BAD', color: '#ef4444', emoji: '📉' },
    F: { letter: 'F', degenLetter: 'RUG', name: 'EXIT NOW', degenName: 'RUGGED', color: '#6c757d', emoji: '🗑️' }
};

// Tier letter shown in the label column, respecting degen mode
function getTierLetter(tier) {
    const t = TIER_LABELS[tier];
    return t ? (isDegenMode ? t.degenLetter : t.letter) : tier;
}

// Known logo CDN prefixes, compressed to one char in share links
const LOGO_HOSTS = [
    { code: 'a', prefix: 'https://assets.coingecko.com/coins/images/' },
    { code: 'i', prefix: 'https://coin-images.coingecko.com/coins/images/' },
    { code: 'm', prefix: 'https://s2.coinmarketcap.com/static/img/coins/64x64/' }
];

// Compress a logo URL to '<hostCode><path>' for share links; '' if not compressible
function compressLogoUrl(url) {
    if (typeof url !== 'string' || !url) return '';
    for (const host of LOGO_HOSTS) {
        if (url.startsWith(host.prefix)) {
            // Drop cache-buster query strings; CDNs serve the bare path fine
            const rest = url.substring(host.prefix.length).split('?')[0];
            // Refs with these chars wouldn't survive the share-link round trip
            if (/[%!|~\s]/.test(rest)) return '';
            return host.code + rest;
        }
    }
    return '';
}

// Expand a compressed logo ref back to a full, validated URL
function expandLogoRef(ref) {
    if (typeof ref !== 'string' || ref.length < 2) return '';
    const host = LOGO_HOSTS.find(h => h.code === ref[0]);
    if (!host) return '';
    return sanitizeLogoUrl(host.prefix + ref.substring(1));
}

// Find a coin in the static category lists by symbol
function findStaticCoin(symbol) {
    for (const category of Object.values(STATIC_CATEGORY_COINS)) {
        const found = category.find(c => c.symbol === symbol);
        if (found) return found;
    }
    return null;
}

// Escape string for use in CSS selectors
function escapeSelector(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, '\\$&');
}

// DOM-authoritative existence check: looks in tier contents and the user's pool.
// Excludes .category-coin nodes. those are display-only category listings, not owned coins.
// Keeps coinSet in sync whenever the DOM disagrees so the next check is cheap.
function coinExistsInDOM(symbol) {
    if (!symbol) return false;
    const safe = escapeSelector(symbol);
    const inTier = document.querySelector(`.tier-content .coin[data-coin="${safe}"]`);
    const inPool = document.querySelector(`#coinContainer .coin[data-coin="${safe}"]:not(.category-coin)`);
    const exists = Boolean(inTier || inPool);
    if (exists && !coinSet.has(symbol)) coinSet.add(symbol);
    return exists;
}

// Touch support variables
let touchClone = null;
let touchStartX = 0;
let touchStartY = 0;

// ============================================
// PERFORMANCE: Optimization utilities
// ============================================

// Set for O(1) coin existence checks
let coinSet = new Set(defaultCoins);

// Debounce utility for reducing frequent calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounced save to prevent excessive localStorage writes
let saveTimeout = null;
function debouncedSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveTimeout = null;
        actualSaveToLocalStorage();
    }, 150); // 150ms debounce
}

// RequestAnimationFrame throttle for smooth animations
function rafThrottle(func) {
    let rafId = null;
    return function throttledFunction(...args) {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
            func(...args);
            rafId = null;
        });
    };
}

// Search result cache (5 minute expiry)
const searchCache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000;
const MAX_SEARCH_CACHE_SIZE = 50; // Maximum number of cached search results
const MAX_CATEGORY_CACHE_SIZE = 10; // Maximum number of cached categories

// Cache management functions
function cleanupSearchCache() {
    const now = Date.now();
    // Remove expired entries
    for (const [key, value] of searchCache.entries()) {
        if (now - value.timestamp > CACHE_EXPIRY) {
            searchCache.delete(key);
        }
    }
    // If still over limit, remove oldest entries
    if (searchCache.size > MAX_SEARCH_CACHE_SIZE) {
        const entries = Array.from(searchCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toRemove = entries.slice(0, entries.length - MAX_SEARCH_CACHE_SIZE);
        toRemove.forEach(([key]) => searchCache.delete(key));
    }
}

function cleanupCategoryCache() {
    const now = Date.now();
    const keys = Object.keys(categoryCache);
    // Remove expired entries
    keys.forEach(key => {
        if (now - categoryCache[key].timestamp > CACHE_EXPIRY) {
            delete categoryCache[key];
        }
    });
    // If still over limit, remove oldest entries
    const remainingKeys = Object.keys(categoryCache);
    if (remainingKeys.length > MAX_CATEGORY_CACHE_SIZE) {
        const entries = remainingKeys.map(key => ({ key, timestamp: categoryCache[key].timestamp }));
        entries.sort((a, b) => a.timestamp - b.timestamp);
        const toRemove = entries.slice(0, entries.length - MAX_CATEGORY_CACHE_SIZE);
        toRemove.forEach(({ key }) => delete categoryCache[key]);
    }
}

// Run cache cleanup periodically (every 2 minutes)
setInterval(() => {
    cleanupSearchCache();
    cleanupCategoryCache();
}, 2 * 60 * 1000);

// ============================================
// SECURITY/PERFORMANCE: API Rate Limiting
// ============================================
const rateLimiter = {
    lastRequestTime: 0,
    minInterval: 1000, // Minimum 1 second between requests
    retryAfter: 0, // Time to wait after 429 error
    consecutiveErrors: 0,
    maxRetries: 3,

    async throttle() {
        const now = Date.now();

        // Check if we're in a retry backoff period
        if (this.retryAfter > now) {
            const waitTime = this.retryAfter - now;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        // Ensure minimum interval between requests
        const elapsed = now - this.lastRequestTime;
        if (elapsed < this.minInterval) {
            await new Promise(resolve => setTimeout(resolve, this.minInterval - elapsed));
        }

        this.lastRequestTime = Date.now();
    },

    handleSuccess() {
        this.consecutiveErrors = 0;
        this.retryAfter = 0;
    },

    handleError(status) {
        this.consecutiveErrors++;

        if (status === 429) {
            // Rate limited - exponential backoff
            const backoffTime = Math.min(30000, 1000 * Math.pow(2, this.consecutiveErrors));
            this.retryAfter = Date.now() + backoffTime;
            console.warn(`Rate limited. Backing off for ${backoffTime}ms`);
        }
    },

    shouldRetry() {
        return this.consecutiveErrors < this.maxRetries;
    }
};

// Wrapper for rate-limited fetch
async function rateLimitedFetch(url, options = {}) {
    await rateLimiter.throttle();

    try {
        const response = await fetch(url, options);

        if (response.ok) {
            rateLimiter.handleSuccess();
            return response;
        }

        if (response.status === 429) {
            rateLimiter.handleError(429);
            // Try to get retry-after header
            const retryAfter = response.headers.get('Retry-After');
            if (retryAfter) {
                rateLimiter.retryAfter = Date.now() + (parseInt(retryAfter, 10) * 1000);
            }

            if (rateLimiter.shouldRetry()) {
                // Retry after backoff
                return rateLimitedFetch(url, options);
            }
        }

        rateLimiter.handleError(response.status);
        return response;
    } catch (error) {
        rateLimiter.handleError(0);
        throw error;
    }
}

// Static coin data for each category (no API calls needed)
const STATIC_CATEGORY_COINS = {
    'top-marketcap': [
        { symbol: 'BTC', name: 'Bitcoin', id: 'bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
        { symbol: 'ETH', name: 'Ethereum', id: 'ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
        { symbol: 'XRP', name: 'XRP', id: 'ripple', image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' },
        { symbol: 'SOL', name: 'Solana', id: 'solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
        { symbol: 'BNB', name: 'BNB', id: 'binancecoin', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
        { symbol: 'DOGE', name: 'Dogecoin', id: 'dogecoin', image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png' },
        { symbol: 'ADA', name: 'Cardano', id: 'cardano', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png' },
        { symbol: 'TRX', name: 'TRON', id: 'tron', image: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png' },
        { symbol: 'LINK', name: 'Chainlink', id: 'chainlink', image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png' },
        { symbol: 'AVAX', name: 'Avalanche', id: 'avalanche-2', image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png' },
        { symbol: 'SUI', name: 'Sui', id: 'sui', image: 'https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg' },
        { symbol: 'XLM', name: 'Stellar', id: 'stellar', image: 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png' },
        { symbol: 'SHIB', name: 'Shiba Inu', id: 'shiba-inu', image: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png' },
        { symbol: 'ZEC', name: 'Zcash', id: 'zcash', image: 'https://coin-images.coingecko.com/coins/images/486/large/circle-zcash-color.png' },
        { symbol: 'BCH', name: 'Bitcoin Cash', id: 'bitcoin-cash', image: 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png' },
        { symbol: 'LTC', name: 'Litecoin', id: 'litecoin', image: 'https://assets.coingecko.com/coins/images/2/standard/litecoin.png' },
        { symbol: 'XMR', name: 'Monero', id: 'monero', image: 'https://assets.coingecko.com/coins/images/69/large/monero_logo.png' },
        { symbol: 'HYPE', name: 'Hyperliquid', id: 'hyperliquid', image: 'https://assets.coingecko.com/coins/images/50882/standard/hyperliquid.jpg' },
        { symbol: 'M', name: 'MemeCore', id: 'memecore', image: 'https://coin-images.coingecko.com/coins/images/53247/large/square-bg-transparent.png' },
        { symbol: 'CC', name: 'Canton', id: 'canton-network', image: 'https://coin-images.coingecko.com/coins/images/70468/large/Canton-Ticker_%281%29.png' }
    ],
    'ai': [
        { symbol: 'RENDER', name: 'Render', id: 'render-token', image: 'https://assets.coingecko.com/coins/images/11636/large/rndr.png' },
        { symbol: 'TAO', name: 'Bittensor', id: 'bittensor', image: 'https://assets.coingecko.com/coins/images/28452/large/ARUsPeNQ_400x400.jpeg' },
        { symbol: 'FET', name: 'Artificial Superintelligence Alliance', id: 'fetch-ai', image: 'https://assets.coingecko.com/coins/images/5681/standard/ASI.png' },
        { symbol: 'GRT', name: 'The Graph', id: 'the-graph', image: 'https://assets.coingecko.com/coins/images/13397/large/Graph_Token.png' },
        { symbol: 'AR', name: 'Arweave', id: 'arweave', image: 'https://assets.coingecko.com/coins/images/4343/large/oRt6SiEN_400x400.jpg' },
        { symbol: 'AKT', name: 'Akash Network', id: 'akash-network', image: 'https://assets.coingecko.com/coins/images/12785/large/akash-logo.png' },
        { symbol: 'AIOZ', name: 'AIOZ Network', id: 'aioz-network', image: 'https://assets.coingecko.com/coins/images/14631/large/aioz-logo-200.png' },
        { symbol: 'FIL', name: 'Filecoin', id: 'filecoin', image: 'https://assets.coingecko.com/coins/images/12817/large/filecoin.png' },
        { symbol: 'BAT', name: 'Basic Attention Token', id: 'basic-attention-token', image: 'https://assets.coingecko.com/coins/images/677/large/basic-attention-token.png' },
        { symbol: 'THETA', name: 'Theta Network', id: 'theta-token', image: 'https://assets.coingecko.com/coins/images/2538/large/theta-token-logo.png' },
        { symbol: 'ATH', name: 'Aethir', id: 'aethir', image: 'https://assets.coingecko.com/coins/images/36179/standard/logogram_circle_dark_green_vb_green_%281%29.png' },
        { symbol: 'VIRTUAL', name: 'Virtuals Protocol', id: 'virtual-protocol', image: 'https://assets.coingecko.com/coins/images/34057/standard/LOGOMARK.png' }
    ],
    'rwa': [
        { symbol: 'LINK', name: 'Chainlink', id: 'chainlink', image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png' },
        { symbol: 'ONDO', name: 'Ondo', id: 'ondo-finance', image: 'https://assets.coingecko.com/coins/images/26580/large/ONDO.png' },
        { symbol: 'HBAR', name: 'Hedera', id: 'hedera-hashgraph', image: 'https://assets.coingecko.com/coins/images/3688/large/hbar.png' },
        { symbol: 'AVAX', name: 'Avalanche', id: 'avalanche-2', image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png' },
        { symbol: 'VET', name: 'VeChain', id: 'vechain', image: 'https://assets.coingecko.com/coins/images/1167/standard/VET.png' },
        { symbol: 'XDC', name: 'XDC Network', id: 'xdce-crowd-sale', image: 'https://assets.coingecko.com/coins/images/2912/large/xdc-icon.png' },
        { symbol: 'QNT', name: 'Quant', id: 'quant-network', image: 'https://assets.coingecko.com/coins/images/3370/large/5ZOu7brX_400x400.jpg' },
        { symbol: 'INJ', name: 'Injective', id: 'injective-protocol', image: 'https://assets.coingecko.com/coins/images/12882/large/Secondary_Symbol.png' },
        { symbol: 'IOTA', name: 'IOTA', id: 'iota', image: 'https://assets.coingecko.com/coins/images/692/standard/IOTA_Thumbnail_%281%29.png' }
    ],
    'gaming': [
        { symbol: 'IMX', name: 'Immutable', id: 'immutable-x', image: 'https://assets.coingecko.com/coins/images/17233/large/immutableX-symbol-BLK-RGB.png' },
        { symbol: 'BEAM', name: 'Beam', id: 'beam-2', image: 'https://assets.coingecko.com/coins/images/32417/large/chain-logo.png' },
        { symbol: 'GALA', name: 'Gala', id: 'gala', image: 'https://assets.coingecko.com/coins/images/12493/large/GALA-COINGECKO.png' },
        { symbol: 'SAND', name: 'The Sandbox', id: 'the-sandbox', image: 'https://assets.coingecko.com/coins/images/12129/large/sandbox_logo.jpg' },
        { symbol: 'AXS', name: 'Axie Infinity', id: 'axie-infinity', image: 'https://assets.coingecko.com/coins/images/13029/large/axie_infinity_logo.png' },
        { symbol: 'MANA', name: 'Decentraland', id: 'decentraland', image: 'https://assets.coingecko.com/coins/images/878/large/decentraland-mana.png' },
        { symbol: 'RONIN', name: 'Ronin', id: 'ronin', image: 'https://assets.coingecko.com/coins/images/20009/large/ronin.jpg' },
        { symbol: 'PRIME', name: 'Echelon Prime', id: 'echelon-prime', image: 'https://assets.coingecko.com/coins/images/29053/large/prime-logo-small-border_%282%29.png' },
        { symbol: 'GUNZ', name: 'GUNZ', id: 'gunz', image: 'https://assets.coingecko.com/coins/images/55027/standard/gunz.jpg' },
        { symbol: 'NXPC', name: 'Nexpace', id: 'nexpace', image: 'https://assets.coingecko.com/coins/images/55703/standard/wk63iOZz_400x400.png' }
    ],
    'meme': [
        { symbol: 'DOGE', name: 'Dogecoin', id: 'dogecoin', image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png' },
        { symbol: 'SHIB', name: 'Shiba Inu', id: 'shiba-inu', image: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png' },
        { symbol: 'PEPE', name: 'Pepe', id: 'pepe', image: 'https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg' },
        { symbol: 'WIF', name: 'dogwifhat', id: 'dogwifcoin', image: 'https://assets.coingecko.com/coins/images/33566/large/dogwifhat.jpg' },
        { symbol: 'BONK', name: 'Bonk', id: 'bonk', image: 'https://assets.coingecko.com/coins/images/28600/large/bonk.jpg' },
        { symbol: 'FLOKI', name: 'FLOKI', id: 'floki', image: 'https://assets.coingecko.com/coins/images/16746/large/PNG_image.png' },
        { symbol: 'TRUMP', name: 'Official Trump', id: 'official-trump', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/35336.png' },
        { symbol: 'FARTCOIN', name: 'Fartcoin', id: 'fartcoin', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/33597.png' },
        { symbol: 'MOG', name: 'Mog Coin', id: 'mog-coin', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/27659.png' }
    ]
};

// Track currently highlighted drop zone to avoid redundant DOM queries
let currentHighlightedZone = null;

// Track insertion position for reordering within tiers
let insertionTarget = null; // The coin element to insert before/after
let insertionPosition = null; // 'before' or 'after'

// Keyboard navigation state
let keyboardSelectedCoin = null;
const TIER_ORDER = ['S', 'A', 'B', 'C', 'D', 'F']; // pool is NOT part of the arrow cycle; use 0/Esc to send to pool

// Touch move is handled once per animation frame via requestAnimationFrame.
// This aligns updates with the display refresh and avoids the drift that Date.now-based
// throttling can introduce on slower devices where touchmove fires below 60Hz.
let pendingTouchEvent = null;
let touchMoveRafId = null;

// DOM Elements
const coinContainer = document.getElementById('coinContainer');
const coinInput = document.getElementById('coinInput');
const searchResults = document.getElementById('searchResults');
const addCoinBtn = document.getElementById('addCoinBtn');
const exportBtn = document.getElementById('exportBtn');
const submitBtn = document.getElementById('submitBtn');
const shareBtn = document.getElementById('shareBtn');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const clearBtn = document.getElementById('clearBtn');
const resetBtn = document.getElementById('resetBtn');
const degenToggle = document.getElementById('degenToggle');
const themeToggle = document.getElementById('themeToggle');
const tierContents = document.querySelectorAll('.tier-content');

// PERFORMANCE: Cache tier elements for fast access
const tierElementCache = {};
['S', 'A', 'B', 'C', 'D', 'F'].forEach(tier => {
    tierElementCache[tier] = {
        content: document.querySelector(`.tier-content[data-tier="${tier}"]`),
        badge: document.querySelector(`.tier-count[data-tier="${tier}"]`),
        row: document.querySelector(`.tier-row[data-tier="${tier}"]`)
    };
});

let searchTimeout;
let selectedCoin = null;
let isDegenMode = false;
let isLightMode = false;
let customTierNames = {}; // Store custom tier names set by user

// Apply the current view mode to the page chrome: body class, banner,
// pool heading, helper copy, and which primary action is visible
function applyViewMode() {
    document.body.classList.remove('mode-builder', 'mode-review', 'mode-verdict');
    document.body.classList.add(`mode-${viewMode}`);

    const banner = document.getElementById('modeBanner');
    const bannerText = document.getElementById('modeBannerText');
    const bannerCta = document.getElementById('modeBannerCta');
    const poolTitle = document.getElementById('coinPoolTitle');
    const helper = document.getElementById('tierHelper');

    if (viewMode === 'review') {
        if (banner) banner.hidden = false;
        if (bannerText) bannerText.innerHTML = '📥 <strong>PORTFOLIO SUBMISSION</strong>. drag their coins into verdict tiers, then hit SHARE ON X.';
        if (bannerCta) bannerCta.hidden = true;
        if (poolTitle) poolTitle.textContent = 'Unranked coins';
        if (helper) helper.innerHTML = '<strong>Time to judge.</strong> Drag coins from the portfolio above into verdict tiers.';
    } else if (viewMode === 'verdict') {
        if (banner) banner.hidden = false;
        if (bannerText) bannerText.innerHTML = '↗ <strong>SHARED TIER LIST</strong>. Rankings shared by the creator.';
        if (bannerCta) bannerCta.hidden = false;
        if (poolTitle) poolTitle.textContent = 'Unranked Coins';
    } else {
        if (banner) banner.hidden = true;
        if (poolTitle) poolTitle.textContent = 'Unranked coins';
    }
}

// Initialize
function init() {
    setupEventListeners();
    setupCategoryTabs();
    setupEditableTierNames();

    // Fire-and-forget: search works against the live API until this lands
    loadCoinIndex();

    // Check for shared link first - if present, load from it instead of localStorage
    const sharedLinkLoaded = loadFromShareableLink();

    if (!sharedLinkLoaded) {
        loadFromLocalStorage();
    }

    initThemeFromSystem();

    if (sharedLinkLoaded) {
        // A shared portfolio just rendered into the pool. loading a category
        // tab here would wipe it. Land on the portfolio tab instead.
        activateCategoryTab('none');
    } else {
        // Start on the user's own portfolio (renders the empty-state hint
        // for first-time visitors)
        activateCategoryTab('none');
        renderCoins();
    }

    // Initialize tier count badges
    updateTierCounts();

    applyViewMode();
}

// Setup editable tier names
function setupEditableTierNames() {
    const tierNames = document.querySelectorAll('.tier-name');
    tierNames.forEach(nameEl => {
        nameEl.style.cursor = 'pointer';
        nameEl.title = 'Click to edit tier name';
        nameEl.addEventListener('click', (e) => {
            e.stopPropagation();
            makeTierNameEditable(nameEl);
        });
    });
}

// Make a tier name editable
function makeTierNameEditable(nameEl) {
    // Don't edit if already editing
    if (nameEl.querySelector('input')) return;

    const tierRow = nameEl.closest('.tier-row');
    const tier = tierRow?.dataset.tier;
    if (!tier) return;

    const currentText = nameEl.textContent;

    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tier-name-input';
    input.value = currentText;
    input.maxLength = 12;
    input.style.cssText = `
        background: transparent;
        border: 1px solid currentColor;
        color: inherit;
        font: inherit;
        width: 80px;
        text-align: center;
        padding: 2px 4px;
        border-radius: 4px;
        outline: none;
    `;

    // Save on blur or Enter
    const saveEdit = () => {
        const newValue = input.value.trim().toUpperCase() || getDefaultTierName(tier);
        nameEl.textContent = newValue;

        // Store custom name if different from default
        const defaultName = getDefaultTierName(tier);
        if (newValue !== defaultName) {
            customTierNames[tier] = newValue;
        } else {
            delete customTierNames[tier];
        }

        saveToLocalStorage();
    };

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            input.blur();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            nameEl.textContent = currentText;
        }
    });

    // Replace text with input
    nameEl.textContent = '';
    nameEl.appendChild(input);
    input.focus();
    input.select();
}

// Get default tier name based on current mode
function getDefaultTierName(tier) {
    const t = TIER_LABELS[tier];
    if (!t) return tier;
    return isDegenMode ? t.degenName : t.name;
}

// Initialize theme from system preference (if no saved preference)
function initThemeFromSystem() {
    const savedState = localStorage.getItem('martinezAccessTierListState');

    // Only use system preference if user hasn't set a preference
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            if (typeof state.isLightMode === 'boolean') {
                // User has a saved preference, don't override
                return;
            }
        } catch (e) {
            // Invalid saved state, continue with system detection
        }
    }

    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)');

    if (prefersLight.matches) {
        isLightMode = true;
        document.body.classList.add('light-mode');
        const themeIcon = themeToggle?.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = '☀️';
        }
    }
    // Default is dark mode, so no action needed if prefersDark

    // Listen for system theme changes
    prefersDark.addEventListener('change', handleSystemThemeChange);

    // MEMORY: Store reference for cleanup
    window._themeMediaQuery = prefersDark;
}

// Handle system theme change
function handleSystemThemeChange(e) {
    // Only auto-switch if user hasn't manually set a preference
    const savedState = localStorage.getItem('martinezAccessTierListState');
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            if (typeof state.isLightMode === 'boolean') {
                // User has manually set preference, don't auto-switch
                return;
            }
        } catch (err) {
            // Continue with auto-switch
        }
    }

    // e.matches is true when system is dark mode
    const systemWantsLight = !e.matches;

    if (systemWantsLight !== isLightMode) {
        toggleTheme();
    }
}

// Setup category tab event listeners
function setupCategoryTabs() {
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => handleCategoryClick(tab));
    });
}

// Update active tab styling/accessibility and track the current category
function activateCategoryTab(category) {
    document.querySelectorAll('.category-tab').forEach(t => {
        const isTarget = t.dataset.category === category;
        t.classList.toggle('active', isTarget);
        t.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });
    currentCategory = category;
}

// Handle category tab click
function handleCategoryClick(tab) {
    const category = tab.dataset.category;

    activateCategoryTab(category);

    // If "My Coins" tab, show user's coins
    if (category === 'none') {
        renderCoins();
        return;
    }

    // Load and display category coins (static data, no API calls)
    fetchCategoryCoins(category);
}

// Load coins for a specific category from static data (no API calls)
function fetchCategoryCoins(category) {
    const staticCoins = STATIC_CATEGORY_COINS[category];
    if (!staticCoins) {
        console.error('Unknown category:', category);
        renderCoins();
        return;
    }

    // Use static data directly - no API calls needed
    displayCategoryCoins(staticCoins);
}


// Display coins from a category (for adding to user's collection)
function displayCategoryCoins(categoryCoins) {
    const fragment = document.createDocumentFragment();

    categoryCoins.forEach((coin, index) => {
        const symbol = coin.symbol.toUpperCase();
        // Check both coinSet and DOM (pool + tiers). coin can exist in either
        const alreadyAdded = coinSet.has(symbol) || coinExistsInDOM(symbol);

        // Store coin data for later use
        if (!customCoinData[symbol]) {
            customCoinData[symbol] = {
                logo: coin.image,
                name: coin.name,
                id: coin.id
            };
        }

        const coinEl = document.createElement('div');
        coinEl.className = `coin category-coin ${alreadyAdded ? 'already-added' : ''}`;
        coinEl.dataset.coin = symbol;
        coinEl.dataset.coinId = coin.id;
        coinEl.style.animationDelay = `${Math.min(index * 0.05, 2)}s`;

        // Create logo image
        const logo = document.createElement('img');
        logo.className = 'coin-logo';
        // NOTE: Don't set crossOrigin for display - CoinGecko doesn't support CORS hotlinking
        logo.draggable = false;
        logo.loading = 'lazy'; // PERFORMANCE: Native lazy loading
        logo.decoding = 'async'; // PERFORMANCE: Async image decoding
        logo.referrerPolicy = 'no-referrer'; // Help with hotlink protection
        if (coin.image) {
            const validatedUrl = sanitizeLogoUrl(coin.image);
            if (validatedUrl) {
                logo.src = validatedUrl;
            }
        }
        // ACCESSIBILITY: Descriptive alt text
        logo.alt = `${coin.name} (${symbol}) logo`;
        logo.onerror = function() {
            // Show placeholder instead of hiding
            this.style.opacity = '0.3';
            this.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23333"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="20">?</text></svg>');
            this.onerror = null;
        };

        // Create text span
        const text = document.createElement('span');
        text.className = 'coin-text';
        text.textContent = symbol;

        // Create add button
        const addBtn = document.createElement('button');
        addBtn.className = 'coin-add-btn';
        addBtn.innerHTML = alreadyAdded ? '&#10003;' : '+';
        addBtn.title = alreadyAdded ? 'Already added' : 'Add to portfolio';
        addBtn.disabled = alreadyAdded;

        const handleAddCoin = (e) => {
            e.stopPropagation();
            if (!coinSet.has(symbol) && !coinExistsInDOM(symbol)) {
                addCoinFromCategory(symbol, coin);
                addBtn.innerHTML = '&#10003;';
                addBtn.disabled = true;
                coinEl.classList.add('already-added');
            }
        };

        addBtn.addEventListener('click', handleAddCoin);
        // Mobile touch support for add button
        addBtn.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        }, { passive: false });
        addBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!addBtn.disabled) {
                handleAddCoin(e);
            }
        }, { passive: false });

        coinEl.appendChild(logo);
        coinEl.appendChild(text);
        coinEl.appendChild(addBtn);

        // Click/tap on coin also adds it
        const handleCoinTap = () => {
            if (!coinSet.has(symbol) && !coinExistsInDOM(symbol)) {
                addCoinFromCategory(symbol, coin);
                addBtn.innerHTML = '&#10003;';
                addBtn.disabled = true;
                coinEl.classList.add('already-added');
            }
        };

        coinEl.addEventListener('click', handleCoinTap);
        // Mobile touch support for coin tap
        let touchMoved = false;
        coinEl.addEventListener('touchstart', () => {
            touchMoved = false;
        }, { passive: true });
        coinEl.addEventListener('touchmove', () => {
            touchMoved = true;
        }, { passive: true });
        coinEl.addEventListener('touchend', (e) => {
            // Only trigger if not scrolling
            if (!touchMoved && e.target === coinEl || e.target.classList.contains('coin-logo') || e.target.classList.contains('coin-text')) {
                e.preventDefault();
                handleCoinTap();
            }
        });

        fragment.appendChild(coinEl);
    });

    coinContainer.innerHTML = '';
    coinContainer.appendChild(fragment);
}

// Add a coin from a category to user's collection
function addCoinFromCategory(symbol, coinData) {
    if (coinSet.has(symbol)) {
        return; // Already exists in set
    }

    // Check the DOM (tiers + pool). the DOM is authoritative over coinSet
    if (coinExistsInDOM(symbol)) {
        return;
    }

    // Store coin data
    customCoinData[symbol] = {
        logo: sanitizeLogoUrl(coinData.image || ''),
        name: sanitizeCoinName(coinData.name || ''),
        id: sanitizeCoinName(coinData.id || '')
    };

    // Add to coins array and set
    coins.push(symbol);
    coinSet.add(symbol);

    saveToLocalStorage();

    // Show feedback
    showNotification(`${symbol} added to your portfolio!`);
}

// PERFORMANCE: Render coins using DocumentFragment for batched DOM updates.
// Skip coins that already have a DOM element inside a tier. rendering those into the pool
// would create duplicates (one in the tier, one in the pool), which then makes remove/undo
// behave incorrectly because both copies carry the same data-coin.
function renderCoins() {
    const tierPlaced = new Set();
    document.querySelectorAll('.tier-content .coin').forEach(el => {
        if (el.dataset.coin) tierPlaced.add(el.dataset.coin);
    });

    const fragment = document.createDocumentFragment();
    coins.forEach((coin, index) => {
        if (tierPlaced.has(coin)) return; // already placed in a tier
        const coinEl = createCoinElement(coin, index);
        if (coinEl) {
            fragment.appendChild(coinEl);
        }
    });
    coinContainer.innerHTML = '';
    coinContainer.appendChild(fragment);

    updatePoolEmptyState();

    // Keep Set in sync with full ownership list (coinSet tracks *all* owned coins, not just pool)
    coinSet = new Set(coins);
}

// Keep the empty-portfolio hint in sync with the portfolio contents.
// Must be called whenever a coin is added or removed outside renderCoins.
function updatePoolEmptyState() {
    const existing = coinContainer.querySelector('.pool-empty-state');
    const showHint = coins.length === 0 && currentCategory === 'none';
    if (showHint && !existing) {
        const empty = document.createElement('div');
        empty.className = 'pool-empty-state';
        empty.innerHTML = 'Search for a coin above, or browse <strong>TOP 20 · AI · RWA · GAMING · MEME</strong> and tap <strong>+</strong> to start your list.';
        coinContainer.appendChild(empty);
    } else if (!showHint && existing) {
        existing.remove();
    }
}

// Create coin element
function createCoinElement(coinName, index) {
    // SECURITY: Sanitize coin name
    const safeCoinName = sanitizeCoinName(coinName);
    if (!safeCoinName) {
        console.error('Invalid coin name');
        return null;
    }

    const coinEl = document.createElement('div');
    coinEl.className = 'coin';
    coinEl.draggable = true;
    coinEl.dataset.coin = safeCoinName;
    coinEl.tabIndex = 0; // Make focusable for keyboard navigation
    coinEl.setAttribute('role', 'button');
    coinEl.setAttribute('aria-label', `${safeCoinName} coin. Press Enter to pick up and move.`);
    coinEl.style.animationDelay = `${Math.min(index * 0.05, 2)}s`; // Cap animation delay

    // Create logo image
    const logo = document.createElement('img');
    logo.className = 'coin-logo';
    // NOTE: Don't set crossOrigin for display - CoinGecko doesn't support CORS hotlinking
    logo.draggable = false; // Prevent logo from being draggable separately
    logo.loading = 'lazy'; // PERFORMANCE: Native lazy loading
    logo.decoding = 'async'; // PERFORMANCE: Async image decoding
    logo.referrerPolicy = 'no-referrer'; // Help with hotlink protection

    // Get logo from customCoinData (populated by loadDefaultCoinLogos or search)
    if (customCoinData[safeCoinName] && customCoinData[safeCoinName].logo) {
        const validatedUrl = sanitizeLogoUrl(customCoinData[safeCoinName].logo);
        if (validatedUrl) {
            logo.src = validatedUrl;
        }
    }
    // If no logo yet, it will be set when loadDefaultCoinLogos completes

    // ACCESSIBILITY: Descriptive alt text using full coin name if available
    const coinFullName = customCoinData[safeCoinName]?.name || safeCoinName;
    logo.alt = `${coinFullName} (${safeCoinName}) logo`;

    logo.onerror = function() {
        // Show placeholder instead of hiding
        this.style.opacity = '0.3';
        this.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23333"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="20">?</text></svg>');
        this.onerror = null; // Prevent infinite loop
    };

    // Create text span
    const text = document.createElement('span');
    text.className = 'coin-text';
    text.textContent = safeCoinName;

    // Create remove button with double-tap confirmation
    const removeBtn = document.createElement('button');
    removeBtn.className = 'coin-remove';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = 'Remove coin';

    const handleRemoveClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (removeBtn.classList.contains('confirm')) {
            removeCoin(safeCoinName);
        } else {
            // First tap - show confirmation state
            removeBtn.classList.add('confirm');
            removeBtn.innerHTML = 'Sure?';
            // Reset after 2 seconds if not confirmed
            setTimeout(() => {
                removeBtn.classList.remove('confirm');
                removeBtn.innerHTML = '&times;';
            }, 2000);
        }
    };

    removeBtn.addEventListener('click', handleRemoveClick);
    // Mobile touch support for remove button
    removeBtn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    }, { passive: false });
    removeBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleRemoveClick(e);
    }, { passive: false });

    coinEl.appendChild(logo);
    coinEl.appendChild(text);
    coinEl.appendChild(removeBtn);

    // Drag events
    coinEl.addEventListener('dragstart', handleDragStart);
    coinEl.addEventListener('dragend', handleDragEnd);

    // Touch events for mobile
    coinEl.addEventListener('touchstart', handleTouchStart, { passive: false });
    coinEl.addEventListener('touchmove', handleTouchMove, { passive: false });
    coinEl.addEventListener('touchend', handleTouchEnd);

    // Keyboard events for accessibility
    coinEl.addEventListener('keydown', handleCoinKeydown);

    return coinEl;
}

// Setup event listeners
function setupEventListeners() {
    // Add coin button
    addCoinBtn.addEventListener('click', addCoin);

    // Search coins as user types
    coinInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        let query = e.target.value.trim();

        // SECURITY: Enforce max length on input
        if (query.length > 50) {
            query = query.substring(0, 50);
            e.target.value = query;
        }

        if (query.length < 2) {
            searchResults.innerHTML = '';
            searchResults.style.display = 'none';
            coinInput.setAttribute('aria-expanded', 'false');
            return;
        }

        searchTimeout = setTimeout(() => searchCoins(query), 300);
    });

    // Enter key to add coin
    coinInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addCoin();
        }
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            searchResults.style.display = 'none';
            coinInput.setAttribute('aria-expanded', 'false');
        }
    });

    // Ctrl+Z to undo coin removal
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && lastRemovedCoin) {
            e.preventDefault();
            undoRemove();
            const toast = document.querySelector('.undo-toast');
            if (toast) {
                toast.classList.add('hiding');
                setTimeout(() => toast.remove(), 300);
            }
        }
    });

    // Global app-level keyboard shortcuts
    document.addEventListener('keydown', handleGlobalShortcut);

    // Help modal & shortcut hint wiring
    const helpModal = document.getElementById('helpModal');
    if (helpModal) {
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) closeHelpModal();
        });
    }
    const hint = document.getElementById('shortcutHint');
    if (hint) {
        hint.addEventListener('click', (e) => {
            if (e.target.classList.contains('shortcut-hint-close')) {
                dismissShortcutHint();
            } else {
                openHelpModal();
            }
        });
        // Show hint on first visit only
        if (!localStorage.getItem('martinezAccessTierListHintSeen')) {
            setTimeout(() => hint.classList.add('visible'), 1200);
        }
    }

    // Command palette wiring
    setupCommandPalette();

    // Clear all tiers - move coins back to pool
    clearBtn.addEventListener('click', () => {
        // Switch to "My Coins" tab first
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        const myCoinsTab = document.querySelector('.category-tab[data-category="none"]');
        if (myCoinsTab) myCoinsTab.classList.add('active');
        currentCategory = 'none';

        // Collect coins from tiers before re-rendering
        const tierCoinSymbols = [];
        tierContents.forEach(tier => {
            const tierCoins = tier.querySelectorAll('.coin');
            tierCoins.forEach(coin => {
                tierCoinSymbols.push(coin.dataset.coin);
            });
            tier.innerHTML = ''; // Clear the tier
        });

        // Re-render to show "My Coins" view, which will include all coins
        renderCoins();

        saveToLocalStorage();
    });

    // Export as image
    exportBtn.addEventListener('click', exportAsImage);

    // Share to X
    shareBtn.addEventListener('click', shareToX);
    if (submitBtn) {
        submitBtn.addEventListener('click', submitForReview);
    }

    const modeBannerCta = document.getElementById('modeBannerCta');
    if (modeBannerCta) {
        modeBannerCta.addEventListener('click', () => {
            // Drop the share hash and reload into the visitor's own builder
            window.location.href = window.location.pathname;
        });
    }

    // Copy shareable link
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', copyShareableLink);
    }

    // Reset to default (clear all coins and tiers)
    resetBtn.addEventListener('click', () => {
        showConfirmModal('Clear all coins and tiers? You can add new coins from the category tabs.', () => {
            coins = [];
            coinSet = new Set();
            customCoinData = {};
            categoryCache = {}; // Clear category cache
            tierContents.forEach(tier => tier.innerHTML = '');
            // Switch to "My Coins" tab
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            const myCoinsTab = document.querySelector('.category-tab[data-category="none"]');
            if (myCoinsTab) myCoinsTab.classList.add('active');
            currentCategory = 'none';
            renderCoins();
            saveToLocalStorage();
        });
    });

    // Degen mode toggle
    degenToggle.addEventListener('click', toggleDegenMode);

    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Setup drop zones
    tierContents.forEach(tier => {
        tier.addEventListener('dragover', handleDragOver);
        tier.addEventListener('drop', handleDrop);
        tier.addEventListener('dragleave', handleDragLeave);
        tier.addEventListener('dragenter', handleDragEnter);
    });

    // Also allow dropping back to coin pool
    coinContainer.addEventListener('dragover', handleDragOver);
    coinContainer.addEventListener('drop', handleDrop);
    coinContainer.addEventListener('dragleave', handleDragLeave);
    coinContainer.addEventListener('dragenter', handleDragEnter);
}

// SECURITY: Helper to show search messages safely
function showSearchMessage(message) {
    searchResults.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'search-item no-results';
    div.textContent = message;
    searchResults.appendChild(div);
    searchResults.style.display = 'block';
    coinInput.setAttribute('aria-expanded', 'true');
}

// Local coin search index (coins-index.json, built by scripts/build-coin-index.js).
// Loaded async at startup; search falls back to the live API when the index is
// missing or has no match for a query.
let coinIndex = null;

async function loadCoinIndex() {
    try {
        const res = await fetch('/tier-list-assets/coins-index.json');
        if (!res.ok) return;
        const raw = await res.json();
        if (!Array.isArray(raw)) return;
        coinIndex = raw
            .filter(entry => Array.isArray(entry) && typeof entry[0] === 'string')
            .map(entry => ({
                symbol: sanitizeCoinName(String(entry[0])).toUpperCase(),
                name: String(entry[1] || ''),
                id: String(entry[2] || ''),
                large: expandLogoRef(String(entry[3] || ''))
            }))
            .filter(coin => coin.symbol);
    } catch (e) {
        // Offline or index missing. live search still works
    }
}

// Search the local index. Results are shaped like CoinGecko API search hits
// so displaySearchResults and the palette consume them unchanged.
function searchCoinIndex(query, limit) {
    if (!coinIndex || !query) return [];
    const q = query.toLowerCase();
    const exact = [];
    const starts = [];
    const includes = [];
    for (const coin of coinIndex) {
        const sym = coin.symbol.toLowerCase();
        const name = coin.name.toLowerCase();
        // Exact NAME counts too: index order is market cap, so typing
        // "bitcoin" ranks Bitcoin above a joke coin whose symbol is BITCOIN
        if (sym === q || name === q) {
            exact.push(coin);
        } else if (sym.startsWith(q) || name.startsWith(q)) {
            if (starts.length < limit) starts.push(coin);
        } else if (sym.includes(q) || name.includes(q)) {
            if (includes.length < limit) includes.push(coin);
        }
    }
    return exact.concat(starts, includes).slice(0, limit);
}

// Abort controller for in-flight searches. cancels stale requests on new keystrokes
let currentSearchController = null;

// PERFORMANCE: Search with caching + AbortController for race safety
async function searchCoins(query) {
    // SECURITY: Validate and sanitize query
    if (typeof query !== 'string' || query.length > 100) {
        showSearchMessage('Invalid search query');
        return;
    }
    // Remove potentially dangerous characters
    const sanitizedQuery = query.replace(/[<>"'&\\]/g, '').trim();
    if (sanitizedQuery.length < 2) {
        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
        coinInput.setAttribute('aria-expanded', 'false');
        return;
    }

    // PERFORMANCE: Local index first. instant results, no API call.
    // Coins outside the top ~1500 fall through to the live search below.
    const localResults = searchCoinIndex(sanitizedQuery, 5);
    if (localResults.length > 0) {
        displaySearchResults(localResults);
        return;
    }

    // PERFORMANCE: Check cache first
    const cacheKey = sanitizedQuery.toLowerCase();
    const cached = searchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRY) {
        displaySearchResults(cached.data);
        return;
    }

    // Abort any in-flight request so stale responses can't overwrite newer ones
    if (currentSearchController) {
        currentSearchController.abort();
    }
    currentSearchController = new AbortController();
    const signal = currentSearchController.signal;

    // Show skeleton placeholders while fetching
    showSearchSkeletons();

    try {
        const response = await rateLimitedFetch(
            `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(sanitizedQuery)}`,
            { signal }
        );

        // If the signal fired while we were awaiting, bail out quietly
        if (signal.aborted) return;

        if (!response.ok) {
            throw new Error(`Search request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (signal.aborted) return;

        if (data.coins && data.coins.length > 0) {
            const results = data.coins.slice(0, 5);
            if (searchCache.size >= MAX_SEARCH_CACHE_SIZE) {
                cleanupSearchCache();
            }
            searchCache.set(cacheKey, { data: results, timestamp: Date.now() });
            displaySearchResults(results);
        } else {
            showSearchMessage('No coins found');
        }
    } catch (error) {
        // AbortError is expected when users keep typing. swallow silently
        if (error.name === 'AbortError') return;
        console.error('Search failed:', error);
        showSearchMessage('Search failed. Try again.');
    }
}

// Show skeleton loaders in the search dropdown while fetching
function showSearchSkeletons() {
    searchResults.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const row = document.createElement('div');
        row.className = 'search-item';
        row.style.cursor = 'default';
        row.innerHTML = '<div class="coin-skeleton-logo" style="width:32px;height:32px;flex-shrink:0;"></div>' +
                        '<div class="search-info"><div class="coin-skeleton-text" style="width:100px;height:14px;margin-bottom:4px;"></div>' +
                        '<div class="coin-skeleton-text" style="width:40px;height:10px;"></div></div>';
        searchResults.appendChild(row);
    }
    searchResults.style.display = 'block';
    coinInput.setAttribute('aria-expanded', 'true');
}

// Display search results
function displaySearchResults(coinList) {
    searchResults.innerHTML = '';

    coinList.forEach(coin => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-item';
        resultItem.setAttribute('role', 'option');
        resultItem.tabIndex = 0;

        const logo = document.createElement('img');
        logo.decoding = 'async'; // PERFORMANCE: Async image decoding
        logo.referrerPolicy = 'no-referrer'; // Help with hotlink protection
        // SECURITY: Sanitize logo URL from API response
        const logoUrl = sanitizeLogoUrl(coin.thumb || coin.large || '');
        if (logoUrl) {
            logo.src = logoUrl;
        }
        // ACCESSIBILITY: Descriptive alt text
        logo.alt = `${coin.name} (${coin.symbol.toUpperCase()}) logo`;
        logo.className = 'search-logo';
        logo.onerror = function() {
            this.style.opacity = '0.3';
            this.onerror = null;
        };

        const info = document.createElement('div');
        info.className = 'search-info';

        const name = document.createElement('div');
        name.className = 'search-name';
        name.textContent = coin.name;

        const symbol = document.createElement('div');
        symbol.className = 'search-symbol';
        symbol.textContent = coin.symbol.toUpperCase();

        info.appendChild(name);
        info.appendChild(symbol);

        resultItem.appendChild(logo);
        resultItem.appendChild(info);

        const handleSelect = () => {
            // SECURITY: Sanitize all data from API
            selectedCoin = {
                symbol: sanitizeCoinName(coin.symbol.toUpperCase()),
                name: sanitizeCoinName(coin.name || ''),
                id: sanitizeCoinName(coin.id || ''),
                logo: sanitizeLogoUrl(coin.large || coin.thumb || '')
            };
            coinInput.value = selectedCoin.symbol;
            searchResults.style.display = 'none';
            coinInput.setAttribute('aria-expanded', 'false');
            addCoin();
        };

        resultItem.addEventListener('click', handleSelect);
        resultItem.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleSelect();
        });
        resultItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelect();
            }
        });

        searchResults.appendChild(resultItem);
    });

    searchResults.style.display = 'block';
    coinInput.setAttribute('aria-expanded', 'true');
}

// Add custom coin
function addCoin() {
    const rawSymbol = selectedCoin ? selectedCoin.symbol : coinInput.value.trim().toUpperCase();
    // SECURITY: Sanitize coin symbol
    const coinSymbol = sanitizeCoinName(rawSymbol);

    if (!coinSymbol) {
        showNotification('Search for a coin to add', 'warning');
        coinInput.focus();
        coinInput.classList.add('input-highlight');
        setTimeout(() => coinInput.classList.remove('input-highlight'), 2000);
        return;
    }

    // PERFORMANCE: O(1) lookup using Set instead of Array.includes + DOM query
    if (coinSet.has(coinSymbol)) {
        showNotification('Coin already exists!', 'warning');
        coinInput.value = '';
        selectedCoin = null;
        return;
    }

    // Also check if coin element already exists in DOM (in any tier or pool)
    const existingCoin = document.querySelector(`.coin[data-coin="${escapeSelector(coinSymbol)}"]`);
    if (existingCoin) {
        // Sync coinSet with DOM state
        coinSet.add(coinSymbol);
        showNotification('Coin already exists!', 'warning');
        coinInput.value = '';
        selectedCoin = null;
        return;
    }

    // Store custom coin data if selected from search
    // SECURITY: Validate logo URL before storing
    if (selectedCoin && selectedCoin.logo) {
        const validatedLogo = sanitizeLogoUrl(selectedCoin.logo);
        customCoinData[coinSymbol] = {
            logo: validatedLogo,
            name: sanitizeCoinName(selectedCoin.name || ''),
            id: sanitizeCoinName(selectedCoin.id || '')
        };
    }

    coins.push(coinSymbol);
    coinSet.add(coinSymbol); // PERFORMANCE: Keep Set in sync
    const coinEl = createCoinElement(coinSymbol, coins.length - 1);
    // SECURITY: Only append if valid element was created
    if (!coinEl) {
        coins.pop(); // Remove from array if element creation failed
        coinSet.delete(coinSymbol); // PERFORMANCE: Keep Set in sync
        showNotification('Failed to add coin', 'error');
        return;
    }
    updatePoolEmptyState();
    coinContainer.appendChild(coinEl);
    coinInput.value = '';
    selectedCoin = null;
    searchResults.style.display = 'none';
    coinInput.setAttribute('aria-expanded', 'false');

    // Trigger animation
    setTimeout(() => {
        coinEl.style.animation = 'none';
        setTimeout(() => {
            coinEl.style.animation = '';
        }, 10);
    }, 10);

    saveToLocalStorage();
}

// Remove coin from the list
function removeCoin(coinSymbol) {
    const safeCoinName = sanitizeCoinName(coinSymbol);
    if (!safeCoinName || !coinSet.has(safeCoinName)) {
        return;
    }

    // Find where the coin currently is (coin pool or which tier)
    const coinEl = document.querySelector(`.coin[data-coin="${safeCoinName}"]`);
    let location = 'pool';
    if (coinEl) {
        const tierContent = coinEl.closest('.tier-content');
        if (tierContent) {
            location = tierContent.dataset.tier;
        }
    }

    // Store for undo
    lastRemovedCoin = {
        symbol: safeCoinName,
        customData: customCoinData[safeCoinName] ? { ...customCoinData[safeCoinName] } : null,
        location: location
    };

    // Remove from coins array
    const index = coins.indexOf(safeCoinName);
    if (index > -1) {
        coins.splice(index, 1);
    }

    // Remove from Set
    coinSet.delete(safeCoinName);

    // Remove custom data if exists
    if (customCoinData[safeCoinName]) {
        delete customCoinData[safeCoinName];
    }

    // Remove coin element from DOM with fade out animation
    if (coinEl) {
        coinEl.classList.add('removing');
        coinEl.addEventListener('animationend', () => {
            coinEl.remove();
            updatePoolEmptyState();
        }, { once: true });
    } else {
        updatePoolEmptyState();
    }

    saveToLocalStorage();
    showUndoToast(safeCoinName);
}

// Show undo toast notification
function showUndoToast(coinName) {
    // Remove any existing undo toast (this action is single-at-a-time)
    const existingToast = document.querySelector('.undo-toast');
    if (existingToast) existingToast.remove();
    clearTimeout(undoTimeout);

    enforceToastLimit();

    const toast = document.createElement('div');
    toast.className = 'undo-toast';

    const message = document.createElement('span');
    message.className = 'undo-toast-message';
    message.textContent = `${coinName} removed`;

    const undoBtn = document.createElement('button');
    undoBtn.className = 'undo-toast-btn';
    undoBtn.textContent = 'UNDO';
    undoBtn.addEventListener('click', () => {
        undoRemove();
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    });

    toast.appendChild(message);
    toast.appendChild(undoBtn);
    getToastStack().appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('visible'));

    undoTimeout = setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
        lastRemovedCoin = null;
    }, 5000);
}

// Undo the last coin removal
function undoRemove() {
    if (!lastRemovedCoin) return;

    const { symbol, customData, location } = lastRemovedCoin;

    // Restore to arrays
    coins.push(symbol);
    coinSet.add(symbol);

    // Restore custom data if any
    if (customData) {
        customCoinData[symbol] = customData;
    }

    // Create the coin element
    const coinEl = createCoinElement(symbol, coins.length - 1);
    if (!coinEl) {
        // Rollback if element creation failed
        coins.pop();
        coinSet.delete(symbol);
        if (customData) delete customCoinData[symbol];
        return;
    }

    // Add to correct location
    if (location === 'pool') {
        coinContainer.appendChild(coinEl);
    } else {
        const tierContent = document.querySelector(`.tier-content[data-tier="${location}"]`);
        if (tierContent) {
            tierContent.appendChild(coinEl);
        } else {
            coinContainer.appendChild(coinEl);
        }
    }
    updatePoolEmptyState();

    saveToLocalStorage();
    lastRemovedCoin = null;
    clearTimeout(undoTimeout);
}

// ============================================
// S-TIER CONFETTI ANIMATION
// ============================================

// Confetti debounce + global particle cap. prevents mobile performance cliffs
// when users rapid-drag multiple coins into S-tier.
let lastConfettiAt = 0;
const CONFETTI_DEBOUNCE_MS = 1500;
const MAX_CONCURRENT_CONFETTI_PARTICLES = 150;

function triggerSTierConfetti(targetElement) {
    const now = Date.now();
    if (now - lastConfettiAt < CONFETTI_DEBOUNCE_MS) return;

    // Count particles currently on the page to avoid runaway concurrent bursts
    const activeParticles = document.getElementsByClassName('confetti-particle').length;
    if (activeParticles >= MAX_CONCURRENT_CONFETTI_PARTICLES) return;

    lastConfettiAt = now;

    // Get the position of the S-tier row
    const rect = targetElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Confetti colors (S-tier green + gold accents)
    const colors = ['#22c55e', '#16a34a', '#ffd700', '#00f0ff', '#ff006e', '#ffffff'];

    // Scale down particle count if we're getting close to the cap
    const headroom = MAX_CONCURRENT_CONFETTI_PARTICLES - activeParticles;
    const particleCount = Math.min(50, headroom);
    const container = document.createElement('div');
    container.className = 'confetti-container';
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
        overflow: hidden;
    `;
    document.body.appendChild(container);

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'confetti-particle';

        // Random properties
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 10 + 5;
        const angle = (Math.random() * 360) * (Math.PI / 180);
        const velocity = Math.random() * 200 + 100;
        const spin = Math.random() * 720 - 360;

        // Starting position (from center of target)
        const startX = centerX;
        const startY = centerY;

        // End position (spread outward)
        const endX = startX + Math.cos(angle) * velocity;
        const endY = startY + Math.sin(angle) * velocity + 100; // Add gravity

        // Random shape
        const isCircle = Math.random() > 0.5;
        const borderRadius = isCircle ? '50%' : `${Math.random() * 3}px`;

        particle.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY}px;
            width: ${size}px;
            height: ${size * (isCircle ? 1 : 1.5)}px;
            background: ${color};
            border-radius: ${borderRadius};
            pointer-events: none;
            opacity: 1;
            transform: rotate(0deg);
            --end-x: ${endX - startX}px;
            --end-y: ${endY - startY}px;
            --spin: ${spin}deg;
            animation: confetti-burst 1s ease-out forwards;
        `;

        container.appendChild(particle);
    }

    // Clean up after animation
    setTimeout(() => {
        container.remove();
    }, 1200);
}

// Custom confirmation modal
function showConfirmModal(message, onConfirm) {
    // Remove existing modal if any
    const existingModal = document.querySelector('.confirm-modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'confirm-modal-overlay';

    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';

    const messageEl = document.createElement('p');
    messageEl.className = 'confirm-modal-message';
    messageEl.textContent = message;

    const buttons = document.createElement('div');
    buttons.className = 'confirm-modal-buttons';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'confirm-modal-btn cancel';
    cancelBtn.textContent = 'CANCEL';
    cancelBtn.addEventListener('click', () => {
        overlay.classList.add('hiding');
        setTimeout(() => overlay.remove(), 300);
    });

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'confirm-modal-btn confirm';
    confirmBtn.textContent = 'CONFIRM';
    confirmBtn.addEventListener('click', () => {
        overlay.classList.add('hiding');
        setTimeout(() => {
            overlay.remove();
            onConfirm();
        }, 300);
    });

    buttons.appendChild(cancelBtn);
    buttons.appendChild(confirmBtn);
    modal.appendChild(messageEl);
    modal.appendChild(buttons);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Trigger animation
    requestAnimationFrame(() => {
        overlay.classList.add('visible');
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.add('hiding');
            setTimeout(() => overlay.remove(), 300);
        }
    });

    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            overlay.classList.add('hiding');
            setTimeout(() => overlay.remove(), 300);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// ============================================
// REORDERING: Insertion indicator helpers
// ============================================

// Clear all insertion indicators
function clearInsertionIndicator() {
    if (insertionTarget) {
        insertionTarget.classList.remove('insert-before', 'insert-after');
        insertionTarget = null;
        insertionPosition = null;
    }
    // Also clear any stray indicators
    document.querySelectorAll('.insert-before, .insert-after').forEach(el => {
        el.classList.remove('insert-before', 'insert-after');
    });
}

// Update insertion indicator based on cursor/touch position
function updateInsertionIndicator(clientX, clientY, target) {
    // Find the coin element under the cursor
    const coinEl = target.closest('.coin');

    // Don't show indicator on the dragged element itself
    if (!coinEl || coinEl === draggedElement || coinEl.classList.contains('dragging')) {
        // Clear indicator if not over a coin
        if (insertionTarget) {
            clearInsertionIndicator();
        }
        return;
    }

    // Get coin's bounding rect
    const rect = coinEl.getBoundingClientRect();
    const coinCenterX = rect.left + rect.width / 2;

    // Determine if we're on the left or right half
    const newPosition = clientX < coinCenterX ? 'before' : 'after';

    // Only update if target or position changed
    if (coinEl !== insertionTarget || newPosition !== insertionPosition) {
        // Clear previous indicator
        if (insertionTarget) {
            insertionTarget.classList.remove('insert-before', 'insert-after');
        }

        // Set new indicator
        insertionTarget = coinEl;
        insertionPosition = newPosition;
        coinEl.classList.add(`insert-${newPosition}`);
    }
}

// Get insertion position from coordinates (for touch)
function getInsertionFromPoint(clientX, clientY) {
    const elementBelow = document.elementFromPoint(clientX, clientY);
    if (!elementBelow) return { target: null, position: null };

    const coinEl = elementBelow.closest('.coin');
    if (!coinEl || coinEl === draggedElement) {
        return { target: null, position: null };
    }

    const rect = coinEl.getBoundingClientRect();
    const coinCenterX = rect.left + rect.width / 2;
    const position = clientX < coinCenterX ? 'before' : 'after';

    return { target: coinEl, position };
}

// Remove duplicate coins from a container (keeps the moved coin, removes others with same symbol)
function removeDuplicateCoins(container, movedCoin) {
    if (!container || !movedCoin) return;

    const movedSymbol = movedCoin.dataset.coin;
    const allCoins = container.querySelectorAll('.coin');

    allCoins.forEach(coin => {
        // Remove any other coin with the same symbol (not the one we just moved)
        if (coin !== movedCoin && coin.dataset.coin === movedSymbol) {
            coin.remove();
            showNotification(`Removed duplicate ${movedSymbol}`, 'warning');
        }
    });
}

// Drag handlers
function handleDragStart(e) {
    draggedElement = e.currentTarget;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    // SECURITY: Use text/plain with sanitized coin name instead of innerHTML
    e.dataTransfer.setData('text/plain', sanitizeCoinName(e.currentTarget.dataset.coin || ''));
}

function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');

    // PERFORMANCE: Only clear tracked zone instead of DOM query
    if (currentHighlightedZone) {
        currentHighlightedZone.classList.remove('drag-over');
        currentHighlightedZone = null;
    }

    // Clear insertion indicator
    clearInsertionIndicator();
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';

    // Detect insertion position for reordering
    updateInsertionIndicator(e.clientX, e.clientY, e.target);

    return false;
}

function handleDragEnter(e) {
    if (e.target.classList.contains('tier-content') || e.target.id === 'coinContainer') {
        // PERFORMANCE: Track current zone instead of managing multiple
        if (currentHighlightedZone && currentHighlightedZone !== e.target) {
            currentHighlightedZone.classList.remove('drag-over');
        }
        e.target.classList.add('drag-over');
        currentHighlightedZone = e.target;
    }
}

function handleDragLeave(e) {
    if (e.target.classList.contains('tier-content') || e.target.id === 'coinContainer') {
        // Only remove if we're actually leaving (not entering a child)
        if (!e.currentTarget.contains(e.relatedTarget)) {
            e.target.classList.remove('drag-over');
            if (currentHighlightedZone === e.target) {
                currentHighlightedZone = null;
            }
        }
    }
}

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();

    let dropTarget = e.target;

    // Find the actual drop container
    if (!dropTarget.classList.contains('tier-content') && dropTarget.id !== 'coinContainer') {
        dropTarget = dropTarget.closest('.tier-content');
        if (!dropTarget) {
            dropTarget = coinContainer;
        }
    }

    if (draggedElement && dropTarget) {
        // Insert at specific position if we have an insertion target
        if (insertionTarget && insertionTarget !== draggedElement) {
            if (insertionPosition === 'before') {
                insertionTarget.parentNode.insertBefore(draggedElement, insertionTarget);
            } else {
                insertionTarget.parentNode.insertBefore(draggedElement, insertionTarget.nextSibling);
            }
        } else {
            // Default: append to end
            dropTarget.appendChild(draggedElement);
        }

        // Remove any duplicate coins in the target container
        removeDuplicateCoins(dropTarget, draggedElement);

        // Trigger confetti for S-tier drops!
        if (dropTarget.dataset.tier === 'S') {
            triggerSTierConfetti(dropTarget);
        }

        dropTarget.classList.remove('drag-over');
        currentHighlightedZone = null; // PERFORMANCE: Clear tracked zone
        clearInsertionIndicator();
        saveToLocalStorage();
    }

    return false;
}

// Touch handlers for mobile drag and drop
function handleTouchStart(e) {
    // If tapping the remove button, don't start drag - let the click event handle it
    if (e.target.classList.contains('coin-remove')) {
        return;
    }
    e.preventDefault();
    draggedElement = e.currentTarget;
    const touch = e.touches[0];

    touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    // Create a visual clone for dragging
    touchClone = draggedElement.cloneNode(true);
    touchClone.classList.add('touch-dragging');
    touchClone.style.position = 'fixed';
    touchClone.style.zIndex = '10000';
    touchClone.style.pointerEvents = 'none';
    touchClone.style.opacity = '0.8';
    touchClone.style.transform = 'scale(1.1) rotate(5deg)';
    touchClone.style.left = `${touch.clientX - draggedElement.offsetWidth / 2}px`;
    touchClone.style.top = `${touch.clientY - draggedElement.offsetHeight / 2}px`;

    document.body.appendChild(touchClone);

    // Hide original element
    draggedElement.style.opacity = '0.3';
}

// PERFORMANCE: RAF-coalesced touch move handler
function handleTouchMove(e) {
    e.preventDefault();
    if (!touchClone || !draggedElement) return;

    // Latch the latest touch coordinates; the RAF callback will use whichever is most recent.
    const touch = e.touches[0];
    pendingTouchEvent = { clientX: touch.clientX, clientY: touch.clientY };

    if (touchMoveRafId !== null) return;
    touchMoveRafId = requestAnimationFrame(processTouchMove);
}

function processTouchMove() {
    touchMoveRafId = null;
    const evt = pendingTouchEvent;
    pendingTouchEvent = null;
    if (!evt || !touchClone || !draggedElement) return;

    // Update clone position
    touchClone.style.left = `${evt.clientX - touchClone.offsetWidth / 2}px`;
    touchClone.style.top = `${evt.clientY - touchClone.offsetHeight / 2}px`;

    // Find the element under the touch point (hide clone first so it doesn't intercept)
    touchClone.style.display = 'none';
    const elementBelow = document.elementFromPoint(evt.clientX, evt.clientY);
    const { target, position } = getInsertionFromPoint(evt.clientX, evt.clientY);
    touchClone.style.display = '';

    const dropZone = elementBelow
        ? (elementBelow.closest('.tier-content') || (elementBelow.id === 'coinContainer' ? elementBelow : null))
        : null;

    if (dropZone !== currentHighlightedZone) {
        if (currentHighlightedZone) currentHighlightedZone.classList.remove('drag-over');
        if (dropZone) dropZone.classList.add('drag-over');
        currentHighlightedZone = dropZone;
    }

    if (target !== insertionTarget || position !== insertionPosition) {
        clearInsertionIndicator();
        if (target && position) {
            insertionTarget = target;
            insertionPosition = position;
            target.classList.add(`insert-${position}`);
        }
    }
}

function handleTouchEnd(e) {
    e.preventDefault();

    if (!touchClone || !draggedElement) return;

    const touch = e.changedTouches[0];

    // Find the element under the touch point
    touchClone.style.display = 'none';
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    touchClone.style.display = '';

    // Find the drop target
    let dropTarget = null;
    if (elementBelow) {
        dropTarget = elementBelow.closest('.tier-content') ||
                    (elementBelow.id === 'coinContainer' ? elementBelow : null);
    }

    // Perform the drop
    if (dropTarget) {
        // Insert at specific position if we have an insertion target
        if (insertionTarget && insertionTarget !== draggedElement) {
            if (insertionPosition === 'before') {
                insertionTarget.parentNode.insertBefore(draggedElement, insertionTarget);
            } else {
                insertionTarget.parentNode.insertBefore(draggedElement, insertionTarget.nextSibling);
            }
        } else {
            // Default: append to end
            dropTarget.appendChild(draggedElement);
        }

        // Remove any duplicate coins in the target container
        removeDuplicateCoins(dropTarget, draggedElement);

        // Trigger confetti for S-tier drops!
        if (dropTarget.dataset.tier === 'S') {
            triggerSTierConfetti(dropTarget);
        }

        saveToLocalStorage();
    }

    // Clean up
    draggedElement.style.opacity = '1';

    if (touchClone) {
        touchClone.remove();
        touchClone = null;
    }

    // PERFORMANCE: Clean up tracked highlight instead of DOM query
    if (currentHighlightedZone) {
        currentHighlightedZone.classList.remove('drag-over');
        currentHighlightedZone = null;
    }

    // Clear insertion indicator
    clearInsertionIndicator();

    draggedElement = null;
}

// ============================================
// ACCESSIBILITY: Keyboard navigation for coins
// ============================================

// Handle keyboard events on coins
function handleCoinKeydown(e) {
    const coinEl = e.currentTarget;

    switch (e.key) {
        case 'Enter':
        case ' ':
            e.preventDefault();
            if (keyboardSelectedCoin === coinEl) {
                // Already selected - cancel selection
                cancelKeyboardSelection();
            } else {
                // Select this coin for moving
                selectCoinForKeyboard(coinEl);
            }
            break;
        case 'Escape':
            if (keyboardSelectedCoin) {
                e.preventDefault();
                cancelKeyboardSelection();
            }
            break;
        case 'ArrowUp':
        case 'ArrowDown':
            if (keyboardSelectedCoin === coinEl) {
                e.preventDefault();
                moveSelectedCoinToTier(e.key === 'ArrowUp' ? 'up' : 'down');
            }
            break;
        case 'ArrowLeft':
        case 'ArrowRight':
            if (keyboardSelectedCoin === coinEl) {
                e.preventDefault();
                reorderSelectedCoin(e.key === 'ArrowLeft' ? 'left' : 'right');
            }
            break;
        case 'Delete':
        case 'Backspace':
            e.preventDefault();
            // Trigger remove confirmation
            const removeBtn = coinEl.querySelector('.coin-remove');
            if (removeBtn) {
                removeBtn.click();
            }
            break;
    }
}

// Select a coin for keyboard movement
function selectCoinForKeyboard(coinEl) {
    // Clear previous selection
    if (keyboardSelectedCoin) {
        keyboardSelectedCoin.classList.remove('keyboard-selected');
        keyboardSelectedCoin.setAttribute('aria-label',
            `${keyboardSelectedCoin.dataset.coin} coin. Press Enter to pick up and move.`);
    }

    keyboardSelectedCoin = coinEl;
    coinEl.classList.add('keyboard-selected');
    coinEl.setAttribute('aria-label',
        `${coinEl.dataset.coin} selected. Use Up/Down arrows to move between tiers, Left/Right to reorder, Enter to confirm, Escape to cancel.`);

    // Announce to screen readers
    announceToScreenReader(`${coinEl.dataset.coin} selected. Use Up/Down to move between tiers, Left/Right to reorder.`);
}

// Cancel keyboard selection
function cancelKeyboardSelection() {
    if (keyboardSelectedCoin) {
        keyboardSelectedCoin.classList.remove('keyboard-selected');
        keyboardSelectedCoin.setAttribute('aria-label',
            `${keyboardSelectedCoin.dataset.coin} coin. Press Enter to pick up and move.`);
        keyboardSelectedCoin = null;
        announceToScreenReader('Selection cancelled');
    }
}

// Move the selected coin to a tier (up or down).
// Arrow keys cycle within tiers only; the pool is a separate destination reached via 0/Esc.
function moveSelectedCoinToTier(direction) {
    if (!keyboardSelectedCoin) return;

    const currentContainer = keyboardSelectedCoin.parentElement;
    const fromPool = currentContainer.id === 'coinContainer';

    let newTierIndex;
    if (fromPool) {
        // First tier move from pool lands on S when going down, F when going up
        newTierIndex = direction === 'up' ? TIER_ORDER.length - 1 : 0;
    } else {
        const currentTierIndex = TIER_ORDER.indexOf(currentContainer.dataset.tier);
        if (direction === 'up') {
            newTierIndex = currentTierIndex - 1;
            if (newTierIndex < 0) newTierIndex = TIER_ORDER.length - 1;
        } else {
            newTierIndex = currentTierIndex + 1;
            if (newTierIndex >= TIER_ORDER.length) newTierIndex = 0;
        }
    }

    const newTier = TIER_ORDER[newTierIndex];
    const targetContainer = document.querySelector(`.tier-content[data-tier="${newTier}"]`);

    if (targetContainer && targetContainer !== currentContainer) {
        targetContainer.appendChild(keyboardSelectedCoin);
        removeDuplicateCoins(targetContainer, keyboardSelectedCoin);
        if (newTier === 'S') triggerSTierConfetti(targetContainer);
        keyboardSelectedCoin.focus();
        saveToLocalStorage();
        announceToScreenReader(`Moved to ${newTier} tier`);
    }
}

// Send selected coin back to pool. separate from the tier cycle
function sendSelectedCoinToPool() {
    if (!keyboardSelectedCoin) return;
    if (keyboardSelectedCoin.parentElement.id === 'coinContainer') return;
    coinContainer.appendChild(keyboardSelectedCoin);
    keyboardSelectedCoin.focus();
    saveToLocalStorage();
    announceToScreenReader('Moved to coin pool');
}

// Send selected coin directly to a tier by letter
function sendSelectedCoinToTier(tier) {
    if (!keyboardSelectedCoin) return;
    if (!isValidTierName(tier)) return;
    const target = document.querySelector(`.tier-content[data-tier="${tier}"]`);
    if (!target || target === keyboardSelectedCoin.parentElement) return;
    target.appendChild(keyboardSelectedCoin);
    removeDuplicateCoins(target, keyboardSelectedCoin);
    if (tier === 'S') triggerSTierConfetti(target);
    keyboardSelectedCoin.focus();
    saveToLocalStorage();
    announceToScreenReader(`Moved to ${tier} tier`);
}

// Reorder the selected coin within its current tier (left or right)
function reorderSelectedCoin(direction) {
    if (!keyboardSelectedCoin) return;

    const container = keyboardSelectedCoin.parentElement;
    const coins = Array.from(container.querySelectorAll('.coin'));
    const currentIndex = coins.indexOf(keyboardSelectedCoin);

    if (currentIndex === -1) return;

    let targetIndex;
    if (direction === 'left') {
        targetIndex = currentIndex - 1;
        if (targetIndex < 0) {
            // Already at the start, wrap to end
            targetIndex = coins.length - 1;
        }
    } else {
        targetIndex = currentIndex + 1;
        if (targetIndex >= coins.length) {
            // Already at the end, wrap to start
            targetIndex = 0;
        }
    }

    // Don't move if there's only one coin
    if (coins.length <= 1) {
        announceToScreenReader('Only one coin in this tier');
        return;
    }

    // Get target coin and perform the swap
    const targetCoin = coins[targetIndex];

    if (direction === 'left') {
        // Insert before the target
        container.insertBefore(keyboardSelectedCoin, targetCoin);
    } else {
        // Insert after the target
        if (targetCoin.nextSibling) {
            container.insertBefore(keyboardSelectedCoin, targetCoin.nextSibling);
        } else {
            container.appendChild(keyboardSelectedCoin);
        }
    }

    keyboardSelectedCoin.focus();
    saveToLocalStorage();

    // Announce the position
    const newCoins = Array.from(container.querySelectorAll('.coin'));
    const newIndex = newCoins.indexOf(keyboardSelectedCoin);
    announceToScreenReader(`Moved to position ${newIndex + 1} of ${newCoins.length}`);
}

// Announce messages to screen readers
function announceToScreenReader(message) {
    // Create or reuse the live region
    let liveRegion = document.getElementById('sr-announcer');
    if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = 'sr-announcer';
        liveRegion.setAttribute('role', 'status');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.cssText = 'position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden;';
        document.body.appendChild(liveRegion);
    }

    // Clear and set message (needs to be different for screen reader to announce)
    liveRegion.textContent = '';
    setTimeout(() => {
        liveRegion.textContent = message;
    }, 100);
}

// Global keyboard listener for when a coin is selected
document.addEventListener('keydown', (e) => {
    if (keyboardSelectedCoin && (e.key === 'Escape' || e.key === 'Tab')) {
        if (e.key === 'Escape') {
            cancelKeyboardSelection();
        } else {
            // Tab pressed - deselect but allow normal tab behavior
            keyboardSelectedCoin.classList.remove('keyboard-selected');
            keyboardSelectedCoin = null;
        }
    }
});

// Toggle Degen Mode
function toggleDegenMode() {
    isDegenMode = !isDegenMode;

    // Update button appearance and accessibility
    if (isDegenMode) {
        degenToggle.classList.add('active');
    } else {
        degenToggle.classList.remove('active');
    }
    degenToggle.setAttribute('aria-pressed', isDegenMode.toString());

    // Update all tier labels
    updateTierLabels();

    // Save to localStorage
    saveToLocalStorage();
}

// Toggle Theme (Light/Dark Mode)
function toggleTheme() {
    isLightMode = !isLightMode;

    // Update body class
    document.body.classList.toggle('light-mode', isLightMode);

    // Update theme icon and accessibility
    const themeIcon = themeToggle.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = isLightMode ? '☀️' : '🌙';
    }
    themeToggle.setAttribute('aria-pressed', isLightMode.toString());

    // Save to localStorage
    saveToLocalStorage();
}

// Update tier labels based on mode
function updateTierLabels() {
    Object.keys(TIER_LABELS).forEach(tier => {
        const tierRow = document.querySelector(`.tier-row[data-tier="${tier}"]`);
        if (tierRow) {
            const letterEl = tierRow.querySelector('.tier-letter');
            const nameEl = tierRow.querySelector('.tier-name');

            if (letterEl) letterEl.textContent = getTierLetter(tier);
            // Use custom name if set, otherwise use default
            if (nameEl) nameEl.textContent = customTierNames[tier] || getDefaultTierName(tier);
        }
    });
}

// Update tier count badges + the distribution strip + first-load helper panel.
function updateTierCounts() {
    const tiers = ['S', 'A', 'B', 'C', 'D', 'F'];
    let totalRanked = 0;

    tiers.forEach(tier => {
        const cached = tierElementCache[tier];
        if (!cached || !cached.content || !cached.badge) return;

        const count = cached.content.children.length;
        totalRanked += count;
        cached.badge.textContent = count;
        cached.badge.setAttribute('aria-label', `${count} coin${count !== 1 ? 's' : ''}`);
        cached.badge.classList.toggle('empty', count === 0);
        cached.content.classList.toggle('empty', count === 0);

        // Mirror into the tier-distribution strip
        const summaryItem = document.querySelector(`.tier-summary-item[data-tier="${tier}"] .tier-summary-count`);
        if (summaryItem) summaryItem.textContent = count;
    });

    const totalEl = document.getElementById('tierSummaryTotal');
    if (totalEl) totalEl.textContent = totalRanked;

    // Helper panel: show whenever nothing is ranked yet
    const helper = document.getElementById('tierHelper');
    if (helper) helper.classList.toggle('visible', totalRanked === 0);
}

// SECURITY: Helper to safely set button text
function setButtonText(button, text) {
    button.textContent = '';
    const span = document.createElement('span');
    span.textContent = text;
    button.appendChild(span);
}

// ============================================
// KEYBOARD SHORTCUTS, HELP MODAL, COMMAND PALETTE
// ============================================

// Tier number keys 1-6 map to S/A/B/C/D/F in tier-list order
const TIER_NUMBER_MAP = { '1': 'S', '2': 'A', '3': 'B', '4': 'C', '5': 'D', '6': 'F' };

function isTypingTarget(target) {
    if (!target) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

function isAnyModalOpen() {
    return document.querySelector('.help-modal-overlay.visible, .cmd-palette-overlay.visible, .confirm-modal-overlay.visible');
}

function handleGlobalShortcut(e) {
    // Cmd/Ctrl+K. command palette, overrides typing context
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleCommandPalette();
        return;
    }

    // Esc. close any open modal/palette
    if (e.key === 'Escape') {
        const helpOpen = document.getElementById('helpModal')?.classList.contains('visible');
        const paletteOpen = document.getElementById('cmdPalette')?.classList.contains('visible');
        if (helpOpen) { closeHelpModal(); e.preventDefault(); return; }
        if (paletteOpen) { closeCommandPalette(); e.preventDefault(); return; }
        // Fall through. existing coin-keyboard handler manages its own Esc
    }

    // Skip the rest while the user is typing in an input/textarea
    if (isTypingTarget(e.target)) return;

    // Don't trigger single-key shortcuts while a modal is open
    if (isAnyModalOpen() && e.key !== '?') return;

    // ?. open help modal
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        openHelpModal();
        return;
    }

    // If a coin is currently "picked up" for keyboard move, let its handlers + number keys direct it
    if (keyboardSelectedCoin) {
        if (TIER_NUMBER_MAP[e.key]) {
            e.preventDefault();
            sendSelectedCoinToTier(TIER_NUMBER_MAP[e.key]);
            return;
        }
        if (e.key === '0') {
            e.preventDefault();
            sendSelectedCoinToPool();
            return;
        }
    }

    // Unmodified letter shortcuts
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    switch (e.key) {
        case '/':
        case 's':
            e.preventDefault();
            coinInput?.focus();
            coinInput?.select();
            break;
        case 'u':
            if (lastRemovedCoin) {
                e.preventDefault();
                undoRemove();
            }
            break;
        case 'e':
            e.preventDefault();
            exportAsImage();
            break;
        case 't':
            e.preventDefault();
            toggleTheme();
            break;
    }
}

function openHelpModal() {
    const modal = document.getElementById('helpModal');
    if (!modal) return;
    modal.classList.add('visible');
    modal.setAttribute('aria-hidden', 'false');
    dismissShortcutHint();
}

function closeHelpModal() {
    const modal = document.getElementById('helpModal');
    if (!modal) return;
    modal.classList.remove('visible');
    modal.setAttribute('aria-hidden', 'true');
}

function dismissShortcutHint() {
    const hint = document.getElementById('shortcutHint');
    if (!hint) return;
    hint.classList.remove('visible');
    try { localStorage.setItem('martinezAccessTierListHintSeen', '1'); } catch (_) {}
}

// ---------- Command palette ----------

let cmdPaletteItems = [];
let cmdPaletteActiveIndex = 0;

function toggleCommandPalette() {
    const overlay = document.getElementById('cmdPalette');
    if (!overlay) return;
    if (overlay.classList.contains('visible')) closeCommandPalette();
    else openCommandPalette();
}

function openCommandPalette() {
    const overlay = document.getElementById('cmdPalette');
    const input = document.getElementById('cmdPaletteInput');
    if (!overlay || !input) return;
    overlay.classList.add('visible');
    overlay.setAttribute('aria-hidden', 'false');
    input.value = '';
    renderCommandPaletteResults('');
    setTimeout(() => input.focus(), 50);
    dismissShortcutHint();
}

function closeCommandPalette() {
    const overlay = document.getElementById('cmdPalette');
    if (!overlay) return;
    overlay.classList.remove('visible');
    overlay.setAttribute('aria-hidden', 'true');
}

function setupCommandPalette() {
    const overlay = document.getElementById('cmdPalette');
    const input = document.getElementById('cmdPaletteInput');
    const results = document.getElementById('cmdPaletteResults');
    if (!overlay || !input || !results) return;

    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeCommandPalette();
    });

    // Keyboard nav inside the palette
    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setCmdPaletteActive(cmdPaletteActiveIndex + 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setCmdPaletteActive(cmdPaletteActiveIndex - 1);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            commitCommandPaletteSelection(null);
        } else if (TIER_NUMBER_MAP[e.key]) {
            e.preventDefault();
            commitCommandPaletteSelection(TIER_NUMBER_MAP[e.key]);
        }
    });

    // Debounced input for remote search
    let debounceId = null;
    input.addEventListener('input', () => {
        const q = input.value.trim();
        renderCommandPaletteResults(q);
        if (q.length >= 2) {
            clearTimeout(debounceId);
            debounceId = setTimeout(() => fetchCommandPaletteRemote(q), 250);
        }
    });
}

function getLocalPaletteMatches(query) {
    const q = query.toLowerCase();
    // Flatten all static category coins, dedupe by symbol
    const seen = new Set();
    const matches = [];
    for (const list of Object.values(STATIC_CATEGORY_COINS)) {
        for (const coin of list) {
            const sym = coin.symbol.toUpperCase();
            if (seen.has(sym)) continue;
            seen.add(sym);
            if (!q || sym.toLowerCase().includes(q) || coin.name.toLowerCase().includes(q)) {
                matches.push({
                    symbol: sym,
                    name: coin.name,
                    id: coin.id,
                    image: coin.image,
                    source: 'local'
                });
            }
        }
    }

    // Top up from the search index for coverage beyond the curated lists
    if (q && matches.length < 8) {
        for (const coin of searchCoinIndex(q, 8)) {
            if (matches.length >= 8) break;
            if (seen.has(coin.symbol)) continue;
            seen.add(coin.symbol);
            matches.push({
                symbol: coin.symbol,
                name: coin.name,
                id: coin.id,
                image: coin.large,
                source: 'local'
            });
        }
    }

    return matches.slice(0, 8);
}

function renderCommandPaletteResults(query) {
    const results = document.getElementById('cmdPaletteResults');
    if (!results) return;
    results.innerHTML = '';

    const matches = getLocalPaletteMatches(query);
    cmdPaletteItems = matches;
    cmdPaletteActiveIndex = 0;

    if (matches.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'cmd-palette-empty';
        empty.textContent = query.length >= 2 ? 'Searching…' : 'Type at least 2 characters.';
        results.appendChild(empty);
        return;
    }

    matches.forEach((coin, idx) => {
        const item = document.createElement('div');
        item.className = 'cmd-palette-item' + (idx === 0 ? ' active' : '');
        item.dataset.index = idx;
        item.setAttribute('role', 'option');

        if (coin.image) {
            const img = document.createElement('img');
            img.src = sanitizeLogoUrl(coin.image) || '';
            img.alt = `${coin.name} logo`;
            img.referrerPolicy = 'no-referrer';
            img.decoding = 'async';
            img.onerror = function () { this.style.opacity = '0.3'; };
            item.appendChild(img);
        }

        const info = document.createElement('div');
        info.className = 'cmd-palette-info';
        const name = document.createElement('span');
        name.className = 'cmd-palette-name';
        name.textContent = coin.name;
        const sym = document.createElement('span');
        sym.className = 'cmd-palette-symbol';
        sym.textContent = coin.symbol;
        info.appendChild(name);
        info.appendChild(sym);
        item.appendChild(info);

        item.addEventListener('mouseenter', () => setCmdPaletteActive(idx));
        item.addEventListener('click', () => commitCommandPaletteSelection(null));
        results.appendChild(item);
    });
}

async function fetchCommandPaletteRemote(query) {
    try {
        const response = await rateLimitedFetch(
            `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`
        );
        if (!response.ok) return;
        const data = await response.json();
        if (!data.coins || data.coins.length === 0) return;

        // Merge with local matches. dedupe by symbol
        const existingSymbols = new Set(cmdPaletteItems.map(c => c.symbol));
        const remote = data.coins.slice(0, 8).map(c => ({
            symbol: c.symbol.toUpperCase(),
            name: c.name,
            id: c.id,
            image: c.large || c.thumb || '',
            source: 'remote'
        })).filter(c => !existingSymbols.has(c.symbol));

        // Only re-render if the query still matches the input (racy typing)
        const input = document.getElementById('cmdPaletteInput');
        if (!input || input.value.trim() !== query) return;

        cmdPaletteItems = [...cmdPaletteItems, ...remote].slice(0, 12);
        const results = document.getElementById('cmdPaletteResults');
        if (!results) return;
        // Re-render list preserving active index
        const active = cmdPaletteActiveIndex;
        renderCommandPaletteList();
        setCmdPaletteActive(active);
    } catch (_) {
        // Silent. the local matches are already shown
    }
}

function renderCommandPaletteList() {
    const results = document.getElementById('cmdPaletteResults');
    if (!results) return;
    results.innerHTML = '';
    if (cmdPaletteItems.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'cmd-palette-empty';
        empty.textContent = 'No matches.';
        results.appendChild(empty);
        return;
    }
    cmdPaletteItems.forEach((coin, idx) => {
        const item = document.createElement('div');
        item.className = 'cmd-palette-item' + (idx === cmdPaletteActiveIndex ? ' active' : '');
        item.dataset.index = idx;
        item.setAttribute('role', 'option');
        if (coin.image) {
            const img = document.createElement('img');
            img.src = sanitizeLogoUrl(coin.image) || '';
            img.alt = `${coin.name} logo`;
            img.referrerPolicy = 'no-referrer';
            img.onerror = function () { this.style.opacity = '0.3'; };
            item.appendChild(img);
        }
        const info = document.createElement('div');
        info.className = 'cmd-palette-info';
        const name = document.createElement('span');
        name.className = 'cmd-palette-name';
        name.textContent = coin.name;
        const sym = document.createElement('span');
        sym.className = 'cmd-palette-symbol';
        sym.textContent = coin.symbol;
        info.appendChild(name);
        info.appendChild(sym);
        item.appendChild(info);
        item.addEventListener('mouseenter', () => setCmdPaletteActive(idx));
        item.addEventListener('click', () => commitCommandPaletteSelection(null));
        results.appendChild(item);
    });
}

function setCmdPaletteActive(index) {
    if (cmdPaletteItems.length === 0) return;
    const n = cmdPaletteItems.length;
    cmdPaletteActiveIndex = ((index % n) + n) % n;
    const results = document.getElementById('cmdPaletteResults');
    if (!results) return;
    Array.from(results.children).forEach(child => child.classList.remove('active'));
    const active = results.querySelector(`[data-index="${cmdPaletteActiveIndex}"]`);
    if (active) {
        active.classList.add('active');
        active.scrollIntoView({ block: 'nearest' });
    }
}

function commitCommandPaletteSelection(targetTier) {
    const coin = cmdPaletteItems[cmdPaletteActiveIndex];
    if (!coin) return;

    // Use the existing add flow. it handles sanitize, DOM-sync, dedupe, and persistence
    if (!coinSet.has(coin.symbol) && !coinExistsInDOM(coin.symbol)) {
        addCoinFromCategory(coin.symbol, coin);
    }

    if (targetTier && isValidTierName(targetTier)) {
        const coinEl = document.querySelector(`.coin[data-coin="${escapeSelector(coin.symbol)}"]`);
        const target = document.querySelector(`.tier-content[data-tier="${targetTier}"]`);
        if (coinEl && target) {
            target.appendChild(coinEl);
            removeDuplicateCoins(target, coinEl);
            if (targetTier === 'S') triggerSTierConfetti(target);
            saveToLocalStorage();
        }
    }

    closeCommandPalette();
}

// Share to X (Twitter)
async function shareToX() {
    setButtonLoading(shareBtn, 'GENERATING…');

    try {
        // Use the same export logic as exportAsImage
        const { canvas, exportContainer } = await createExportCanvas();

        // Clean up the export container
        document.body.removeChild(exportContainer);

        // Convert canvas to blob (JPEG format)
        canvas.toBlob(async (blob) => {

            // Try to copy image to clipboard
            let clipboardSuccess = false;
            try {
                const item = new ClipboardItem({ 'image/jpeg': blob });
                await navigator.clipboard.write([item]);
                clipboardSuccess = true;
                console.log('Image copied to clipboard');
            } catch (err) {
                console.log('Clipboard copy not supported or failed:', err);
                // Fallback: download the image if clipboard fails
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const timestamp = new Date().toISOString().slice(0, 10);
                link.download = `martinez-access-tier-list-${timestamp}.jpg`;
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
            }

            // Get tier list summary for tweet
            const tierSummary = getTierSummary();

            // Verdict link so the full review is one click away
            const encoded = encodeShareableData('v');
            const verdictUrl = buildShareUrl(encoded);
            const includeLink = verdictUrl.length <= 2000;

            // Build the tweet with the URL last and truncate only the summary —
            // X counts every URL as 23 chars (t.co), so budget with that
            const header = 'My crypto tier list';
            const footer = includeLink
                ? `Make your own tier list at martinezaccess.com/tier-list\n\n${verdictUrl}`
                : 'Make your own tier list at martinezaccess.com/tier-list';
            const footerTcoLength = includeLink
                ? 'Make your own tier list at '.length + 23 + 2 + 23
                : 'Make your own tier list at '.length + 23;
            let summary = tierSummary;
            const budget = 280 - header.length - 4 - footerTcoLength;
            if (summary.length > budget) {
                summary = summary.substring(0, Math.max(0, budget - 1)) + '…';
            }
            const tweetText = `${header}\n\n${summary}\n\n${footer}`;

            // Keep the published verdict in the address bar
            if (includeLink) {
                window.history.replaceState(null, '', `#share=${encodeURIComponent(encoded)}`);
            }

            if (clipboardSuccess) {
                // Show notification
                showNotification('Image copied! Paste it in your tweet (Ctrl+V or Cmd+V)');
            }

            // Small delay before opening Twitter
            await new Promise(resolve => setTimeout(resolve, 300));

            // Open X with pre-filled tweet
            // SECURITY: Use noopener to prevent reverse tabnabbing
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
            const twitterWindow = window.open(twitterUrl, '_blank', 'noopener,noreferrer');
            if (twitterWindow) {
                twitterWindow.opener = null;
            }

            setButtonSuccess(shareBtn, 'SHARED', 'SHARE ON X');
        }, 'image/jpeg', 0.95);

    } catch (error) {
        console.error('Share failed:', error);
        showNotification('Failed to generate image. Please try again.', 'error');
        resetButtonLoading(shareBtn, 'SHARE ON X');
    }
}

// Get tier summary for sharing
function getTierSummary() {
    const tiers = ['S', 'A', 'B', 'C', 'D', 'F'];
    const summary = [];

    tiers.forEach(tier => {
        const tierContent = document.querySelector(`.tier-content[data-tier="${tier}"]`);
        const coins = Array.from(tierContent.querySelectorAll('.coin')).map(
            coin => coin.dataset.coin
        );

        if (coins.length > 0) {
            const label = customTierNames[tier] || getDefaultTierName(tier);
            summary.push(`${TIER_LABELS[tier].emoji} ${label}: ${coins.slice(0, 5).join(', ')}${coins.length > 5 ? '...' : ''}`);
        }
    });

    return summary.length > 0 ? summary.join('\n') : 'Check out this portfolio verdict!';
}

// Convert image URL to data URL using canvas with CORS proxy
async function imageToDataURL(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || 64;
                canvas.height = img.naturalHeight || 64;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                resolve(dataUrl);
            } catch (error) {
                console.warn('Canvas export failed (CORS):', url);
                resolve(null);
            }
        };

        img.onerror = () => {
            console.warn('Failed to load image:', url);
            resolve(null);
        };

        setTimeout(() => {
            if (!img.complete) {
                console.warn('Image timeout:', url);
                resolve(null);
            }
        }, 5000);

        // Use wsrv.nl image proxy to add CORS headers
        const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=128&h=128&fit=contain&output=png`;
        img.src = proxyUrl;
    });
}

// Load the image renderer only when an export or image share is requested.
let exportRendererPromise;
function loadExportRenderer() {
    if (typeof window.html2canvas === 'function') return Promise.resolve();
    if (!exportRendererPromise) {
        exportRendererPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            const timeout = setTimeout(() => fail(), 15000);
            function fail() {
                clearTimeout(timeout);
                script.remove();
                reject(new Error('Image export could not load. Please try again.'));
            }
            script.src = '/tier-list-assets/vendor/html2canvas.min.js';
            script.onload = () => {
                clearTimeout(timeout);
                if (typeof window.html2canvas === 'function') resolve();
                else fail();
            };
            script.onerror = fail;
            document.head.appendChild(script);
        }).catch(error => {
            exportRendererPromise = null;
            throw error;
        });
    }
    return exportRendererPromise;
}

// Create export canvas (shared between export and share functions)
async function createExportCanvas() {
    await loadExportRenderer();
    // Calculate width based on max coins - wider layout to match website
    let maxCoinsInTier = 0;
    const tiers = ['S', 'A', 'B', 'C', 'D', 'F'];
    tiers.forEach(tier => {
        const tierContent = document.querySelector(`.tier-content[data-tier="${tier}"]`);
        const coinCount = tierContent ? tierContent.querySelectorAll('.coin').length : 0;
        maxCoinsInTier = Math.max(maxCoinsInTier, coinCount);
    });

    // Cap per-row width. tiers with more coins wrap to multiple visual rows rather than
    // producing a 3000px+ canvas that html2canvas struggles with on mobile.
    const MAX_COINS_PER_ROW_EXPORT = 15;
    const coinsForWidth = Math.min(maxCoinsInTier, MAX_COINS_PER_ROW_EXPORT);
    const calculatedWidth = Math.max(1000, 140 + (coinsForWidth * 85));

    // Create export container matching website appearance
    const exportContainer = document.createElement('div');
    exportContainer.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: ${calculatedWidth}px;
        background: #0b1018;
        padding: 15px;
        font-family: Arial, sans-serif;
    `;

    // Header so the exported image is self-explanatory when shared
    const exportHeader = document.createElement('div');
    exportHeader.style.cssText = `
        text-align: center;
        padding: 8px 0 14px;
        font-family: 'Inter', sans-serif;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 4px;
        color: rgba(255, 255, 255, 0.85);
    `;
    exportHeader.textContent = 'MARTINEZ ACCESS · CRYPTO TIER LIST';
    exportContainer.appendChild(exportHeader);

    const tierData = Object.keys(TIER_LABELS).map(tier => ({
        name: tier,
        letter: getTierLetter(tier),
        label: customTierNames[tier] || getDefaultTierName(tier),
        color: TIER_LABELS[tier].color
    }));

    // Pre-load all coin images as data URLs to avoid CORS issues
    const imageCache = {};
    const allCoinsInTiers = [];
    tierData.forEach(tier => {
        const tierContent = document.querySelector(`.tier-content[data-tier="${tier.name}"]`);
        const coins = tierContent ? Array.from(tierContent.querySelectorAll('.coin')).map(c => c.dataset.coin) : [];
        allCoinsInTiers.push(...coins);
    });

    // Load all images in parallel
    await Promise.all(allCoinsInTiers.map(async (coinName) => {
        if (customCoinData[coinName] && customCoinData[coinName].logo) {
            const dataUrl = await imageToDataURL(customCoinData[coinName].logo);
            if (dataUrl) {
                imageCache[coinName] = dataUrl;
            }
        }
    }));

    console.log('Loaded', Object.keys(imageCache).length, 'images as data URLs');

    tierData.forEach(tier => {
        const tierContent = document.querySelector(`.tier-content[data-tier="${tier.name}"]`);
        const coins = tierContent ? Array.from(tierContent.querySelectorAll('.coin')).map(c => c.dataset.coin) : [];

        const row = document.createElement('div');
        row.style.cssText = `
            display: flex;
            width: 100%;
            margin-bottom: 4px;
            border-radius: 6px;
            overflow: hidden;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.1);
            min-height: 75px;
        `;

        const label = document.createElement('div');
        label.style.cssText = `
            width: 100px;
            min-width: 100px;
            background: linear-gradient(180deg, ${tier.color} 0%, ${tier.color}dd 100%);
            padding: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            box-shadow: 2px 0 10px rgba(0,0,0,0.3);
        `;

        const letterDiv = document.createElement('div');
        letterDiv.style.cssText = `
            font-family: 'Inter', monospace;
            font-size: ${tier.letter.length > 2 ? '24px' : '32px'};
            font-weight: 900;
            white-space: nowrap;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
            line-height: 1;
        `;
        letterDiv.textContent = tier.letter;

        const labelTextDiv = document.createElement('div');
        labelTextDiv.style.cssText = `
            font-family: 'Inter', sans-serif;
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 0.7px;
            max-width: 100%;
            overflow-wrap: anywhere;
            text-align: center;
            margin-top: 4px;
            opacity: 0.9;
        `;
        labelTextDiv.textContent = tier.label;

        label.appendChild(letterDiv);
        label.appendChild(labelTextDiv);

        const content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            padding: 8px 12px;
            gap: 6px;
        `;

        if (coins.length > 0) {
            coins.forEach(coinName => {
                const coinEl = document.createElement('div');
                coinEl.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    padding: 4px;
                `;

                // Add coin logo (use cached data URL to avoid CORS)
                if (imageCache[coinName]) {
                    const logo = document.createElement('img');
                    logo.style.cssText = `
                        width: 65px;
                        height: 65px;
                        object-fit: contain;
                        border-radius: 50%;
                    `;
                    logo.src = imageCache[coinName];
                    logo.alt = coinName;
                    coinEl.appendChild(logo);
                }

                const text = document.createElement('span');
                text.style.cssText = `
                    color: #ffffff;
                    font-family: 'Inter', monospace;
                    font-weight: 700;
                    font-size: 11px;
                    letter-spacing: 1px;
                    margin-top: 4px;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
                `;
                text.textContent = coinName;

                coinEl.appendChild(text);
                content.appendChild(coinEl);
            });
        }

        row.appendChild(label);
        row.appendChild(content);
        exportContainer.appendChild(row);
    });

    // Add footer with website URL at bottom right
    const footer = document.createElement('div');
    footer.style.cssText = `
        text-align: right;
        margin-top: 8px;
        padding-right: 2px;
    `;
    const footerText = document.createElement('span');
    footerText.style.cssText = `
        font-family: 'Inter', sans-serif;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.4);
        letter-spacing: 1px;
    `;
    footerText.textContent = 'martinezaccess.com/tier-list';
    footer.appendChild(footerText);
    exportContainer.appendChild(footer);

    document.body.appendChild(exportContainer);

    // Wait for data URL images to decode (they're already loaded, just need rendering)
    const images = exportContainer.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 1000); // Shorter timeout since images are data URLs
        });
    }));

    // Brief pause for rendering
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('Creating canvas with', images.length, 'images...');

    // Use html2canvas - no CORS issues since we use data URLs
    const canvas = await html2canvas(exportContainer, {
        backgroundColor: '#0b1018',
        scale: 2,
        logging: false,
        useCORS: false,
        allowTaint: true, // Safe now since images are data URLs
        imageTimeout: 0,
        removeContainer: false
    });

    console.log('Canvas created:', canvas.width, 'x', canvas.height);

    if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas has zero dimensions');
    }

    return { canvas, exportContainer };
}

// Export tier list as image
async function exportAsImage() {
    setButtonLoading(exportBtn, 'GENERATING…');

    try {
        const { canvas, exportContainer } = await createExportCanvas();
        document.body.removeChild(exportContainer);

        canvas.toBlob((blob) => {
            if (!blob) {
                showNotification('Export failed: No blob created', 'error');
                resetButtonLoading(exportBtn, 'EXPORT IMAGE');
                return;
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 10);
            link.download = `martinez-access-tier-list-${timestamp}.jpg`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);

            setButtonSuccess(exportBtn, 'EXPORTED', 'EXPORT IMAGE');
        }, 'image/jpeg', 0.95);

    } catch (error) {
        console.error('Export failed:', error);
        showNotification('Export failed: ' + error.message, 'error');
        resetButtonLoading(exportBtn, 'EXPORT IMAGE');
    }
}

// Local Storage - debounced wrapper
function saveToLocalStorage() {
    debouncedSave();
    updateTierCounts(); // Update counts immediately for responsive UI
}

// Actual save implementation
function actualSaveToLocalStorage() {
    const state = {
        coins: coins,
        customCoinData: customCoinData,
        customTierNames: customTierNames,
        isDegenMode: isDegenMode,
        isLightMode: isLightMode,
        tiers: {}
    };

    tierContents.forEach(tier => {
        const tierName = tier.dataset.tier;
        const tierCoins = Array.from(tier.querySelectorAll('.coin')).map(
            coin => coin.dataset.coin
        );
        state.tiers[tierName] = tierCoins;
    });

    try {
        const stateString = JSON.stringify(state);
        // Check if data is too large (localStorage limit is typically 5MB)
        if (stateString.length > 4 * 1024 * 1024) { // 4MB safety threshold
            console.warn('State too large for localStorage, trimming old data');
            // Keep only essential data
            const trimmedState = {
                coins: coins.slice(-50), // Keep last 50 coins
                customCoinData: {},
                isDegenMode: isDegenMode,
                isLightMode: isLightMode,
                tiers: state.tiers
            };
            // Only keep customCoinData for coins we're keeping
            trimmedState.coins.forEach(coin => {
                if (customCoinData[coin]) {
                    trimmedState.customCoinData[coin] = customCoinData[coin];
                }
            });
            localStorage.setItem('martinezAccessTierListState', JSON.stringify(trimmedState));
        } else {
            localStorage.setItem('martinezAccessTierListState', stateString);
        }
    } catch (error) {
        if (error.name === 'QuotaExceededError' || error.code === 22) {
            console.error('localStorage quota exceeded, clearing old data');
            // Try to clear and save minimal state
            try {
                localStorage.removeItem('martinezAccessTierListState');
                const minimalState = {
                    coins: coins.slice(-20),
                    customCoinData: {},
                    isDegenMode: isDegenMode,
                    isLightMode: isLightMode,
                    tiers: state.tiers
                };
                localStorage.setItem('martinezAccessTierListState', JSON.stringify(minimalState));
            } catch (retryError) {
                console.error('Failed to save even minimal state:', retryError);
            }
        } else {
            console.error('Failed to save to localStorage:', error);
        }
    }
}

function loadFromLocalStorage() {
    const savedState = localStorage.getItem('martinezAccessTierListState');

    if (!savedState) return;

    try {
        const state = JSON.parse(savedState);

        // SECURITY: Validate state structure
        if (typeof state !== 'object' || state === null) {
            throw new Error('Invalid state structure');
        }

        // SECURITY: Restore and validate custom coin data
        if (state.customCoinData && typeof state.customCoinData === 'object') {
            customCoinData = {};
            Object.keys(state.customCoinData).forEach(key => {
                const sanitizedKey = sanitizeCoinName(key);
                if (!sanitizedKey) return;

                const data = state.customCoinData[key];
                if (data && typeof data === 'object') {
                    customCoinData[sanitizedKey] = {
                        logo: sanitizeLogoUrl(data.logo || ''),
                        name: sanitizeCoinName(data.name || ''),
                        id: sanitizeCoinName(data.id || '')
                    };
                }
            });
        }

        // Restore custom tier names
        if (state.customTierNames && typeof state.customTierNames === 'object') {
            customTierNames = {};
            ['S', 'A', 'B', 'C', 'D', 'F'].forEach(tier => {
                if (typeof state.customTierNames[tier] === 'string') {
                    const sanitized = state.customTierNames[tier].replace(/[^A-Z0-9\s\-]/gi, '').toUpperCase().substring(0, 12);
                    if (sanitized) {
                        customTierNames[tier] = sanitized;
                    }
                }
            });
        }

        // SECURITY: Restore and validate degen mode (must be boolean)
        if (typeof state.isDegenMode === 'boolean') {
            isDegenMode = state.isDegenMode;
            if (isDegenMode) {
                degenToggle.classList.add('active');
            }
            updateTierLabels();
        }

        // Restore theme preference
        if (typeof state.isLightMode === 'boolean') {
            isLightMode = state.isLightMode;
            if (isLightMode) {
                document.body.classList.add('light-mode');
                const themeIcon = themeToggle?.querySelector('.theme-icon');
                if (themeIcon) {
                    themeIcon.textContent = '☀️';
                }
            }
        }

        // SECURITY: Restore and validate coins list
        if (Array.isArray(state.coins)) {
            coins = state.coins
                .filter(coin => typeof coin === 'string')
                .map(coin => sanitizeCoinName(coin))
                .filter(coin => coin); // Remove empty strings
            renderCoins();
        }

        // SECURITY: Restore tier placements with validation
        if (state.tiers && typeof state.tiers === 'object') {
            Object.keys(state.tiers).forEach(tierName => {
                // Validate tier name against known tiers
                if (!isValidTierName(tierName)) return;

                const tierContent = document.querySelector(`.tier-content[data-tier="${tierName}"]`);
                const tierCoins = state.tiers[tierName];

                if (Array.isArray(tierCoins) && tierContent) {
                    tierCoins.forEach(coinName => {
                        const sanitizedCoinName = sanitizeCoinName(coinName);
                        if (!sanitizedCoinName) return;

                        // Use escaped selector for safety
                        const coinEl = document.querySelector(`.coin[data-coin="${escapeSelector(sanitizedCoinName)}"]`);
                        if (coinEl) {
                            tierContent.appendChild(coinEl);
                        }
                    });
                }
            });
        }
        // Update tier count badges after loading
        updateTierCounts();
    } catch (error) {
        console.error('Error loading saved state:', error);
        // SECURITY: Clear potentially corrupted data
        localStorage.removeItem('martinezAccessTierListState');
    }
}

// ============================================
// SHAREABLE LINKS
// ============================================

// Compact URL encoding format (v2):
// Format: 2~S:BTC,ETH|A:SOL~d1~l1~nS:MOON,A:PUMP
// - Version 2 uses ~ as main separator
// - Tiers: TIER:COIN1,COIN2|TIER:COIN (only non-empty tiers)
// - d1 = degen mode on (omit if off)
// - l1 = light mode on (omit if off)
// - n = custom tier names (optional)

// Encode tier list to compact URL format
function encodeShareableData(mode) {
    const parts = ['3']; // Version 3

    // Encode tiers
    const tierParts = [];
    const tiers = ['S', 'A', 'B', 'C', 'D', 'F'];
    const tierPlaced = new Set();
    tiers.forEach(tier => {
        const tierContent = document.querySelector(`.tier-content[data-tier="${tier}"]`);
        if (tierContent) {
            const tierCoins = Array.from(tierContent.querySelectorAll('.coin')).map(c => c.dataset.coin);
            tierCoins.forEach(c => tierPlaced.add(c));
            if (tierCoins.length > 0) {
                tierParts.push(`${tier}:${tierCoins.join(',')}`);
            }
        }
    });

    if (tierParts.length > 0) {
        parts.push(tierParts.join('|'));
    } else {
        parts.push(''); // Empty tiers placeholder
    }

    // Encode flags (only if true)
    const flags = [];
    if (isDegenMode) flags.push('d1');
    if (isLightMode) flags.push('l1');
    if (flags.length > 0) {
        parts.push(flags.join(''));
    }

    // Encode custom tier names (if any)
    const customNames = [];
    Object.keys(customTierNames).forEach(tier => {
        if (customTierNames[tier]) {
            customNames.push(`${tier}:${customTierNames[tier]}`);
        }
    });
    if (customNames.length > 0) {
        parts.push('n' + customNames.join(','));
    }

    // Encode unranked pool coins (owned but not placed in a tier) so a
    // portfolio can be shared before it has a verdict
    const poolCoins = coins.filter(c => !tierPlaced.has(c));
    if (poolCoins.length > 0) {
        parts.push('p' + poolCoins.join(','));
    }

    // Encode name/logo for coins not in the static categories, so they
    // survive the trip to another browser
    const metaParts = [];
    coins.forEach(symbol => {
        if (findStaticCoin(symbol)) return;
        const meta = customCoinData[symbol];
        if (!meta) return;
        const name = sanitizeCoinName(meta.name || '');
        const logoRef = compressLogoUrl(meta.logo || '');
        if (!name && !logoRef) return;
        metaParts.push(`${symbol}!${name}!${logoRef}`);
    });
    if (metaParts.length > 0) {
        parts.push('c' + metaParts.join('|'));
    }

    // Mode marker: 's' = submission (review me), 'v' = published verdict
    if (mode === 's' || mode === 'v') {
        parts.push('m' + mode);
    }

    return parts.join('~');
}

// Decode compact URL format to data object
function decodeShareableData(encoded) {
    try {
        // Version 3 (portfolio review format)
        if (encoded.startsWith('3~')) {
            return decodeShareableDataV3(encoded);
        }

        // Check if it's the old base64 format (version 1)
        if (!encoded.startsWith('2~')) {
            // Try to decode as base64 JSON (backwards compatibility)
            try {
                const jsonString = decodeURIComponent(escape(atob(encoded)));
                return JSON.parse(jsonString);
            } catch (e) {
                return null;
            }
        }

        // Parse version 2 compact format
        const parts = encoded.split('~');
        const version = parts[0];

        if (version !== '2') {
            console.warn('Unknown share format version:', version);
            return null;
        }

        const data = {
            v: 2,
            t: {},
            d: false,
            l: false,
            n: {}
        };

        // Parse tiers (part 1)
        if (parts[1]) {
            const tierParts = parts[1].split('|');
            tierParts.forEach(tierPart => {
                const [tier, coinsStr] = tierPart.split(':');
                if (tier && coinsStr) {
                    data.t[tier] = coinsStr.split(',').filter(c => c);
                }
            });
        }

        // Parse remaining parts (flags and custom names)
        for (let i = 2; i < parts.length; i++) {
            const part = parts[i];
            if (!part) continue;

            // Flags
            if (part.includes('d1')) data.d = true;
            if (part.includes('l1')) data.l = true;

            // Custom tier names
            if (part.startsWith('n')) {
                const namesStr = part.substring(1);
                const namePairs = namesStr.split(',');
                namePairs.forEach(pair => {
                    const [tier, name] = pair.split(':');
                    if (tier && name) {
                        data.n[tier] = name;
                    }
                });
            }
        }

        return data;
    } catch (error) {
        console.error('Failed to decode shareable data:', error);
        return null;
    }
}

// Parse the version 3 compact format. Parts after the tiers are dispatched on
// exact prefix. v2's loose includes('d1') matching would false-positive on
// logo paths inside the new c part.
function decodeShareableDataV3(encoded) {
    const parts = encoded.split('~');

    const data = {
        v: 3,
        t: {},
        d: false,
        l: false,
        n: {},
        p: [],
        c: {},
        m: ''
    };

    // Parse tiers (part 1, same shape as v2)
    if (parts[1]) {
        parts[1].split('|').forEach(tierPart => {
            const [tier, coinsStr] = tierPart.split(':');
            if (tier && coinsStr) {
                data.t[tier] = coinsStr.split(',').filter(c => c);
            }
        });
    }

    for (let i = 2; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;

        if (/^(d1)?(l1)?$/.test(part)) {
            // Flags
            if (part.includes('d1')) data.d = true;
            if (part.includes('l1')) data.l = true;
        } else if (part.startsWith('n')) {
            // Custom tier names
            part.substring(1).split(',').forEach(pair => {
                const [tier, name] = pair.split(':');
                if (tier && name) {
                    data.n[tier] = name;
                }
            });
        } else if (part.startsWith('p')) {
            // Unranked pool coins
            data.p = part.substring(1).split(',').map(sanitizeCoinName).filter(c => c);
        } else if (part.startsWith('c')) {
            // Custom coin metadata: SYMBOL!Name!logoRef entries.
            // Same {l, n} shape as v1's c field so loadFromShareableLink
            // consumes both with one code path.
            part.substring(1).split('|').forEach(entry => {
                const [symbol, name, logoRef] = entry.split('!');
                const safeSymbol = sanitizeCoinName(symbol || '');
                if (!safeSymbol) return;
                data.c[safeSymbol] = {
                    n: sanitizeCoinName(name || ''),
                    l: expandLogoRef(logoRef || '')
                };
            });
        } else if (part.startsWith('m')) {
            // View mode marker
            const mode = part.substring(1);
            if (mode === 's' || mode === 'v') {
                data.m = mode;
            }
        }
    }

    return data;
}

// Build a share URL with the payload percent-encoded so spaces and pipes
// survive being pasted into tweets and chat apps
function buildShareUrl(encoded) {
    return `${CANONICAL_ORIGIN}#share=${encodeURIComponent(encoded)}`;
}

// Copy text to clipboard, falling back to legacy execCommand. Returns true on success.
async function copyTextWithFallback(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        let legacyWorked = false;
        try {
            legacyWorked = document.execCommand('copy');
        } catch (_) {}
        document.body.removeChild(textArea);
        return legacyWorked;
    }
}

// Submit the visitor's portfolio for review: copy the submission link and
// open a pre-filled tweet tagging the reviewer
async function submitForReview() {
    if (coins.length === 0) {
        showNotification('Add the coins you hold first!');
        return;
    }

    const encoded = encodeShareableData('s');
    if (!encoded) {
        showNotification('Failed to generate submission link');
        return;
    }

    const url = buildShareUrl(encoded);
    if (url.length > 2000) {
        showNotification('Portfolio too large to submit via link. Try fewer coins.');
        return;
    }

    setButtonLoading(submitBtn, 'PREPARING…');

    // Keep a copy in the clipboard so it can also be DMed
    const copied = await copyTextWithFallback(url);

    const symbols = coins.slice(0, 8).join(', ');
    const extra = coins.length > 8 ? ` +${coins.length - 8} more` : '';
    const tweetText = `@${REVIEWER_X_HANDLE} review my portfolio 🔍\n\nHolding: ${symbols}${extra}\n\n${url}`;

    // SECURITY: Use noopener to prevent reverse tabnabbing
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    const twitterWindow = window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    if (twitterWindow) {
        twitterWindow.opener = null;
    }

    setButtonSuccess(submitBtn, 'TWEET OPENED', 'SUBMIT FOR REVIEW');
    showNotification(copied
        ? 'Submission link copied too. you can also DM it instead.'
        : 'Tweet opened. the submission link is in it.');
}

// Copy shareable link to clipboard
async function copyShareableLink() {
    if (coins.length === 0) {
        showNotification('Add some coins to your portfolio first!');
        return;
    }

    // Verdict link if anything is tiered, otherwise a submission link
    const tiers = ['S', 'A', 'B', 'C', 'D', 'F'];
    const hasCoinsInTiers = tiers.some(tier => {
        const tierContent = document.querySelector(`.tier-content[data-tier="${tier}"]`);
        return tierContent && tierContent.querySelectorAll('.coin').length > 0;
    });
    const mode = hasCoinsInTiers ? 'v' : 's';

    // Generate compact shareable URL
    const encoded = encodeShareableData(mode);

    if (!encoded) {
        showNotification('Failed to generate shareable link');
        return;
    }

    const url = buildShareUrl(encoded);

    // Check URL length - most browsers support up to ~2000 chars
    if (url.length > 2000) {
        showNotification('Portfolio too large to share via link. Try using fewer coins.');
        return;
    }

    // Loading state on the button
    setButtonLoading(copyLinkBtn, 'COPYING…');

    const copied = await copyTextWithFallback(url);
    if (copied) {
        setButtonSuccess(copyLinkBtn, 'COPIED', 'COPY LINK');
        showNotification(mode === 's'
            ? `Submission link copied. send it to @${REVIEWER_X_HANDLE} on 𝕏!`
            : 'Verdict link copied to clipboard!');
    } else {
        // Last resort: show the URL in a dialog the user can copy manually
        resetButtonLoading(copyLinkBtn, 'COPY LINK');
        showShareLinkFallback(url);
    }

    // Reflect published verdicts in the address bar. Submission links are
    // deliberately NOT put in the hash. reloading would drop the builder
    // into review mode on their own portfolio.
    if (mode === 'v') {
        window.history.replaceState(null, '', `#share=${encodeURIComponent(encoded)}`);
    }
}

// Fallback modal that displays the shareable URL in a selectable field
function showShareLinkFallback(url) {
    const existing = document.querySelector('.share-fallback-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'confirm-modal-overlay share-fallback-overlay';

    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.style.maxWidth = '500px';

    const message = document.createElement('p');
    message.className = 'confirm-modal-message';
    message.textContent = 'Copy this link manually:';

    const input = document.createElement('input');
    input.type = 'text';
    input.readOnly = true;
    input.value = url;
    input.style.cssText = 'width:100%;padding:12px;margin-bottom:20px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#fff;font-family:monospace;font-size:12px;word-break:break-all;';

    const buttons = document.createElement('div');
    buttons.className = 'confirm-modal-buttons';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'confirm-modal-btn confirm';
    copyBtn.textContent = 'TRY COPY';
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(url);
            copyBtn.textContent = 'COPIED ✓';
            setTimeout(() => { overlay.classList.add('hiding'); setTimeout(() => overlay.remove(), 300); }, 600);
        } catch {
            input.select();
        }
    });

    const closeBtn = document.createElement('button');
    closeBtn.className = 'confirm-modal-btn cancel';
    closeBtn.textContent = 'CLOSE';
    closeBtn.addEventListener('click', () => {
        overlay.classList.add('hiding');
        setTimeout(() => overlay.remove(), 300);
    });

    buttons.appendChild(copyBtn);
    buttons.appendChild(closeBtn);
    modal.appendChild(message);
    modal.appendChild(input);
    modal.appendChild(buttons);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.classList.add('visible');
        input.select();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.add('hiding');
            setTimeout(() => overlay.remove(), 300);
        }
    });
}

// Button loading/success helpers. shared across async CTAs.
function setButtonLoading(btn, label) {
    if (!btn) return;
    btn.disabled = true;
    btn.dataset.originalLabel = btn.querySelector('span')?.textContent || label;
    btn.classList.add('is-loading');
    btn.textContent = '';
    const spinner = document.createElement('span');
    spinner.className = 'btn-spinner';
    const span = document.createElement('span');
    span.textContent = label;
    btn.appendChild(spinner);
    btn.appendChild(span);
}

function setButtonSuccess(btn, successLabel, resetLabel) {
    if (!btn) return;
    btn.classList.remove('is-loading');
    btn.classList.add('is-success');
    btn.textContent = '';
    const check = document.createElement('span');
    check.className = 'btn-check';
    check.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    const span = document.createElement('span');
    span.textContent = successLabel;
    btn.appendChild(check);
    btn.appendChild(span);
    setTimeout(() => {
        btn.classList.remove('is-success');
        btn.disabled = false;
        setButtonText(btn, resetLabel);
    }, 1400);
}

function resetButtonLoading(btn, label) {
    if (!btn) return;
    btn.classList.remove('is-loading', 'is-success');
    btn.disabled = false;
    setButtonText(btn, label);
}

// Load tier list from shareable link
function loadFromShareableLink() {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith('#share=')) {
        return false;
    }

    let encoded = hash.substring(7); // Remove '#share='
    if (!encoded) {
        return false;
    }

    // v3 URLs percent-encode the payload (buildShareUrl); older links are raw.
    // The payload never contains '%' itself, so decoding raw links is a no-op.
    try {
        encoded = decodeURIComponent(encoded);
    } catch (e) {
        // Malformed percent-encoding. try the raw payload
    }

    const data = decodeShareableData(encoded);
    if (!data || typeof data !== 'object') {
        console.error('Invalid shareable link data');
        showNotification('Invalid shared link. Loading default state.');
        // Clear the invalid hash
        window.history.replaceState(null, '', window.location.pathname);
        return false;
    }

    try {
        // Validate version (support both v1 and v2)
        if (data.v !== 1 && data.v !== 2) {
            console.warn('Unknown shareable link version:', data.v);
        }

        // Load custom coin data first (for non-static coins, v1 and v3)
        if (data.c && typeof data.c === 'object') {
            Object.keys(data.c).forEach(symbol => {
                const sanitizedSymbol = sanitizeCoinName(symbol);
                if (sanitizedSymbol && data.c[symbol]) {
                    customCoinData[sanitizedSymbol] = {
                        logo: sanitizeLogoUrl(data.c[symbol].l || ''),
                        name: sanitizeCoinName(data.c[symbol].n || ''),
                        id: ''
                    };
                }
            });
        }

        // Collect all coins from the shared pool (unranked, v3) and tiers.
        // Pool coins go first so the Set preserves their submitted order.
        const allCoins = new Set();
        if (Array.isArray(data.p)) {
            data.p.forEach(coin => {
                const sanitized = sanitizeCoinName(coin);
                if (sanitized) allCoins.add(sanitized);
            });
        }
        if (data.t && typeof data.t === 'object') {
            Object.values(data.t).forEach(tierCoins => {
                if (Array.isArray(tierCoins)) {
                    tierCoins.forEach(coin => {
                        const sanitized = sanitizeCoinName(coin);
                        if (sanitized) allCoins.add(sanitized);
                    });
                }
            });
        }

        // Load coin data from static categories for known coins
        allCoins.forEach(symbol => {
            if (!customCoinData[symbol]) {
                const found = findStaticCoin(symbol);
                if (found) {
                    customCoinData[symbol] = {
                        logo: found.image,
                        name: found.name,
                        id: found.id
                    };
                }
            }
        });

        // Set coins array
        coins = Array.from(allCoins);
        coinSet = new Set(coins);

        // Render coins first
        renderCoins();

        // Load tier placements
        if (data.t && typeof data.t === 'object') {
            Object.keys(data.t).forEach(tierName => {
                if (!isValidTierName(tierName)) return;

                const tierContent = document.querySelector(`.tier-content[data-tier="${tierName}"]`);
                const tierCoins = data.t[tierName];

                if (Array.isArray(tierCoins) && tierContent) {
                    tierCoins.forEach(coinName => {
                        const sanitizedCoinName = sanitizeCoinName(coinName);
                        if (!sanitizedCoinName) return;

                        const coinEl = document.querySelector(`.coin[data-coin="${escapeSelector(sanitizedCoinName)}"]`);
                        if (coinEl) {
                            tierContent.appendChild(coinEl);
                        }
                    });
                }
            });
        }

        // Load degen mode
        if (typeof data.d === 'boolean') {
            isDegenMode = data.d;
            if (isDegenMode) {
                degenToggle.classList.add('active');
                degenToggle.setAttribute('aria-pressed', 'true');
            }
        }

        // Load light mode
        if (typeof data.l === 'boolean') {
            isLightMode = data.l;
            if (isLightMode) {
                document.body.classList.add('light-mode');
                const themeIcon = themeToggle?.querySelector('.theme-icon');
                if (themeIcon) {
                    themeIcon.textContent = '☀️';
                }
            }
        }

        // Load custom tier names
        if (data.n && typeof data.n === 'object') {
            customTierNames = {};
            ['S', 'A', 'B', 'C', 'D', 'F'].forEach(tier => {
                if (typeof data.n[tier] === 'string') {
                    const sanitized = data.n[tier].replace(/[^A-Z0-9\s\-]/gi, '').toUpperCase().substring(0, 12);
                    if (sanitized) {
                        customTierNames[tier] = sanitized;
                    }
                }
            });
        }

        // Update tier labels
        updateTierLabels();

        // Determine view mode: explicit marker wins; legacy links (v1/v2)
        // with tiered coins read as published verdicts
        const hasTierCoins = data.t && typeof data.t === 'object' &&
            Object.values(data.t).some(arr => Array.isArray(arr) && arr.length > 0);
        if (data.m === 's') {
            viewMode = 'review';
        } else if (data.m === 'v') {
            viewMode = 'verdict';
        } else {
            viewMode = hasTierCoins ? 'verdict' : 'review';
        }

        // NOTE: intentionally no saveToLocalStorage() here. opening someone
        // else's link must not clobber the viewer's own saved portfolio.
        // Their first edit persists it via the regular save calls, and a
        // refresh re-imports from the hash that is still in the URL.

        showNotification(viewMode === 'review'
            ? 'Portfolio submission loaded. drag the coins into verdict tiers.'
            : 'Shared tier list loaded.');

        return true;
    } catch (error) {
        console.error('Error loading shared portfolio:', error);
        showNotification('Failed to load shared portfolio.', 'error');
        window.history.replaceState(null, '', window.location.pathname);
        return false;
    }
}

// Keep no more than N toasts visible at once. oldest drops first.
const TOAST_STACK_LIMIT = 3;

function getToastStack() {
    let stack = document.getElementById('toastStack');
    if (!stack) {
        // Fallback for older HTML caches. create on demand
        stack = document.createElement('div');
        stack.id = 'toastStack';
        document.body.appendChild(stack);
    }
    return stack;
}

function enforceToastLimit() {
    const stack = getToastStack();
    const toasts = Array.from(stack.children);
    while (toasts.length >= TOAST_STACK_LIMIT) {
        const oldest = toasts.shift();
        if (oldest && !oldest.classList.contains('hiding')) {
            oldest.classList.add('hiding');
            setTimeout(() => oldest.remove(), 250);
        }
    }
}

// Show notification toast
// type can be: 'success' (default), 'error', 'warning'
function showNotification(message, type = 'success') {
    enforceToastLimit();

    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    if (type === 'error' || type === 'warning') {
        notification.classList.add(type);
    }
    notification.textContent = message;
    getToastStack().appendChild(notification);

    requestAnimationFrame(() => notification.classList.add('show'));

    setTimeout(() => {
        notification.classList.add('hiding');
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

// MEMORY: Cleanup function to prevent memory leaks
function cleanup() {
    // Keep the final edit when navigating away before the debounced save fires.
    // Only flush edits: viewing a shared list must not replace a saved list.
    if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
        actualSaveToLocalStorage();
    }
    // Remove system theme change listener
    if (window._themeMediaQuery) {
        window._themeMediaQuery.removeEventListener('change', handleSystemThemeChange);
        window._themeMediaQuery = null;
    }

    // Clear caches
    searchCache.clear();
    Object.keys(categoryCache).forEach(key => delete categoryCache[key]);

    // Clear any pending keyboard selection
    if (keyboardSelectedCoin) {
        keyboardSelectedCoin.classList.remove('keyboard-selected');
        keyboardSelectedCoin = null;
    }

    // Remove screen reader announcer
    const announcer = document.getElementById('sr-announcer');
    if (announcer) {
        announcer.remove();
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', cleanup);
window.addEventListener('pagehide', cleanup);
