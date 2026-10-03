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
    S: { letter: 'S', degenLetter: '100X', name: 'GENERATIONAL', degenName: 'NEVER SELL', color: '#72c99d', emoji: '🔥' },
    A: { letter: 'A', degenLetter: '75X', name: 'STRONG BAG', degenName: 'SEND IT', color: '#a9cf82', emoji: '💎' },
    B: { letter: 'B', degenLetter: '50X', name: 'SOLID', degenName: 'HODL', color: '#dccb8b', emoji: '📈' },
    C: { letter: 'C', degenLetter: '25X', name: 'RETHINK', degenName: 'COPE', color: '#e0ad80', emoji: '📊' },
    D: { letter: 'D', degenLetter: '10X', name: 'TRIM IT', degenName: 'DOWN BAD', color: '#df8f86', emoji: '📉' },
    F: { letter: 'F', degenLetter: 'RUG', name: 'EXIT NOW', degenName: 'RUGGED', color: '#94a3ae', emoji: '🗑️' }
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

// Touch support: the floating copy of a coin that follows the finger
let touchClone = null;

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

// Run cache cleanup periodically (every 2 minutes)
setInterval(cleanupSearchCache, 2 * 60 * 1000);

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
const catalogEl = document.getElementById('catalog');
const catalogGrid = document.getElementById('catalogGrid');
const catalogTitle = document.getElementById('catalogTitle');
const catalogAddAll = document.getElementById('catalogAddAll');
const trayEl = document.getElementById('tray');
const tierPickerEl = document.getElementById('tierPicker');

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
        if (bannerText) bannerText.innerHTML = '<strong>Portfolio submission.</strong> Rank their coins from Unranked, then hit Share on X.';
        if (bannerCta) bannerCta.hidden = true;
        if (poolTitle) poolTitle.textContent = 'Unranked coins';
        if (helper) helper.innerHTML = '<strong>Time to judge.</strong> Drag the coins in Unranked onto verdict tiers, or tap a coin and pick its tier.';
    } else if (viewMode === 'verdict') {
        if (banner) banner.hidden = false;
        if (bannerText) bannerText.innerHTML = '<strong>Shared tier list.</strong> These rankings were shared by their creator.';
        if (bannerCta) bannerCta.hidden = false;
        if (poolTitle) poolTitle.textContent = 'Unranked coins';
    } else {
        if (banner) banner.hidden = true;
        if (poolTitle) poolTitle.textContent = 'Unranked coins';
    }
}

// Initialize
function init() {
    setupEventListeners();
    setupCatalog();
    setupEditableTierNames();
    setupTierPicker();
    setupMenus();
    setupTray();

    // Fire-and-forget: search works against the live API until this lands
    coinIndexReady = loadCoinIndex();

    // Check for shared link first - if present, load from it instead of localStorage
    const sharedLinkLoaded = loadFromShareableLink();

    if (!sharedLinkLoaded) {
        loadFromLocalStorage();
    }

    applyTheme();

    if (!sharedLinkLoaded) {
        // Renders the unranked tray (and its empty state for first-time visitors)
        renderCoins();
    }

    // Initialize tier count badges
    updateTierCounts();
    updateTierLabels();

    applyViewMode();

    // Give every coin its real logo: typed tickers, older saves and shared
    // links can arrive without one
    backfillMissingLogos();
}

// Tier names can be renamed: click, or focus and press Enter
function setupEditableTierNames() {
    const tierNames = document.querySelectorAll('.tier-name');
    tierNames.forEach(nameEl => {
        nameEl.tabIndex = 0;
        nameEl.setAttribute('role', 'button');
        nameEl.title = 'Rename this tier';
        nameEl.addEventListener('click', (e) => {
            e.stopPropagation();
            makeTierNameEditable(nameEl);
        });
        nameEl.addEventListener('keydown', (e) => {
            if (e.target !== nameEl) return; // Keys inside the rename field
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                makeTierNameEditable(nameEl);
            }
        });
    });
}

function tierNameAriaLabel(tier) {
    return `Rename the ${tier} tier, now ${customTierNames[tier] || getDefaultTierName(tier)}`;
}

// Same rules as saved and shared names: letters, numbers, spaces and hyphens
function cleanTierName(value) {
    return String(value || '').replace(/[^A-Z0-9\s\-]/gi, '').replace(/\s+/g, ' ').trim().toUpperCase().substring(0, 12);
}

// Make a tier name editable
function makeTierNameEditable(nameEl) {
    // Don't edit if already editing
    if (nameEl.querySelector('input')) return;

    const tierRow = nameEl.closest('.tier-row');
    const tier = tierRow?.dataset.tier;
    if (!tier) return;

    const currentText = nameEl.textContent;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tier-name-input';
    input.value = currentText;
    input.maxLength = 12;
    input.setAttribute('aria-label', `New name for the ${tier} tier`);
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

    let finished = false;
    const finish = (save) => {
        if (finished) return;
        finished = true;
        const newValue = save ? (cleanTierName(input.value) || getDefaultTierName(tier)) : currentText;
        nameEl.textContent = newValue;

        if (save) {
            // Store custom name if different from default
            if (newValue !== getDefaultTierName(tier)) {
                customTierNames[tier] = newValue;
            } else {
                delete customTierNames[tier];
            }
            saveToLocalStorage();
        }
        nameEl.setAttribute('aria-label', tierNameAriaLabel(tier));
    };

    input.addEventListener('blur', () => finish(true));
    input.addEventListener('keydown', (e) => {
        e.stopPropagation(); // Typing here must not trigger page shortcuts
        if (e.key === 'Enter') {
            e.preventDefault();
            finish(true);
            nameEl.focus();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            finish(false);
            nameEl.focus();
        }
    });
    input.addEventListener('click', (e) => e.stopPropagation());

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

// Reflect the theme on the page and the toggle. Dark is the default, matching
// the rest of the site; light mode is opt-in and remembered.
function applyTheme() {
    document.body.classList.toggle('light-mode', isLightMode);
    if (themeToggle) {
        const label = isLightMode ? 'Switch to dark mode' : 'Switch to light mode';
        themeToggle.setAttribute('aria-pressed', isLightMode ? 'true' : 'false');
        themeToggle.setAttribute('aria-label', label);
        themeToggle.title = label;
    }
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', isLightMode ? '#e9eef2' : '#11171d');
}

// ============================================
// CATALOG: browse curated categories and add coins in one tap
// ============================================

const CATEGORY_TITLES = {
    'top-marketcap': 'Top 20 by market cap',
    'ai': 'AI and machine learning',
    'rwa': 'Real-world assets',
    'gaming': 'Gaming',
    'meme': 'Meme coins'
};

let openCatalogCategory = null;

function setupCatalog() {
    document.querySelectorAll('.chip[data-category]').forEach(chip => {
        chip.addEventListener('click', (e) => {
            e.stopPropagation();
            const category = chip.dataset.category;
            if (openCatalogCategory === category) {
                closeCatalog();
            } else {
                openCatalog(category);
            }
        });
    });

    // Category switcher inside the catalog (shown on phones, where the
    // catalog sheet covers the chips)
    document.querySelectorAll('.catalog-tab[data-category]').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.stopPropagation();
            openCatalog(tab.dataset.category);
        });
    });

    const closeBtn = document.getElementById('catalogClose');
    if (closeBtn) closeBtn.addEventListener('click', () => closeCatalog(true));
    if (catalogAddAll) catalogAddAll.addEventListener('click', addAllFromCatalog);

    // Click outside the catalog (and its chips) closes it
    document.addEventListener('click', (e) => {
        if (!openCatalogCategory) return;
        if (e.target.closest('#catalog') || e.target.closest('.chip[data-category]')) return;
        closeCatalog();
    });
}

function openCatalog(category) {
    const list = STATIC_CATEGORY_COINS[category];
    if (!list || !catalogEl) return;
    closeTierPicker();
    openCatalogCategory = category;
    document.querySelectorAll('.chip[data-category]').forEach(chip => {
        chip.setAttribute('aria-expanded', chip.dataset.category === category ? 'true' : 'false');
    });
    document.querySelectorAll('.catalog-tab[data-category]').forEach(tab => {
        tab.setAttribute('aria-pressed', tab.dataset.category === category ? 'true' : 'false');
    });
    if (catalogTitle) catalogTitle.textContent = CATEGORY_TITLES[category] || 'Coins';
    catalogEl.scrollTop = 0;
    renderCatalog();
    catalogEl.hidden = false;
}

function closeCatalog(returnFocus) {
    if (!catalogEl || catalogEl.hidden) {
        openCatalogCategory = null;
        return;
    }
    const category = openCatalogCategory;
    catalogEl.hidden = true;
    openCatalogCategory = null;
    document.querySelectorAll('.chip[data-category]').forEach(chip => chip.setAttribute('aria-expanded', 'false'));
    if (returnFocus && category) {
        document.querySelector(`.chip[data-category="${category}"]`)?.focus();
    }
}

// Render the open category as a grid of add buttons
function renderCatalog() {
    const list = STATIC_CATEGORY_COINS[openCatalogCategory];
    if (!list || !catalogGrid) return;
    const fragment = document.createDocumentFragment();
    let remaining = 0;

    list.forEach(coin => {
        const symbol = coin.symbol.toUpperCase();
        const added = coinSet.has(symbol) || coinExistsInDOM(symbol);
        if (!added) remaining++;

        if (!customCoinData[symbol]) {
            customCoinData[symbol] = { logo: coin.image, name: coin.name, id: coin.id };
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `catalog-coin${added ? ' is-added' : ''}`;
        btn.dataset.coin = symbol;
        btn.setAttribute('aria-pressed', added ? 'true' : 'false');
        btn.setAttribute('aria-label', added ? `${coin.name} (${symbol}) is in your list` : `Add ${coin.name} (${symbol})`);

        const logo = document.createElement('img');
        logo.alt = '';
        logo.loading = 'lazy';
        logo.decoding = 'async';
        logo.referrerPolicy = 'no-referrer';
        setLogoImage(logo, symbol, coin.image);

        const text = document.createElement('span');
        text.className = 'cc-text';
        const sym = document.createElement('span');
        sym.className = 'cc-sym';
        sym.textContent = symbol;
        const name = document.createElement('span');
        name.className = 'cc-name';
        name.textContent = coin.name;
        text.append(sym, name);

        const state = document.createElement('span');
        state.className = 'cc-state';
        state.setAttribute('aria-hidden', 'true');
        state.textContent = added ? '✓' : '+';

        btn.append(logo, text, state);
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (coinSet.has(symbol) || coinExistsInDOM(symbol)) return;
            addCoinFromCategory(symbol, coin);
            renderCatalog();
        });
        fragment.appendChild(btn);
    });

    catalogGrid.innerHTML = '';
    catalogGrid.appendChild(fragment);

    if (catalogAddAll) {
        catalogAddAll.disabled = remaining === 0;
        catalogAddAll.textContent = remaining === 0 ? 'All added' : `Add all ${remaining}`;
    }
}

function addAllFromCatalog(e) {
    if (e) e.stopPropagation();
    const list = STATIC_CATEGORY_COINS[openCatalogCategory];
    if (!list) return;
    let added = 0;
    list.forEach(coin => {
        const symbol = coin.symbol.toUpperCase();
        if (coinSet.has(symbol) || coinExistsInDOM(symbol)) return;
        if (addCoinFromCategory(symbol, coin, { quiet: true })) added++;
    });
    renderCatalog();
    if (added > 0) {
        announceToScreenReader(`Added ${added} coins to Unranked`);
        showNotification(`Added ${added} coin${added === 1 ? '' : 's'} to Unranked.`);
    }
}

// Add a coin from a category, search, or the palette to the user's list.
// The coin lands in the Unranked tray. Returns true when it was added.
function addCoinFromCategory(symbol, coinData, options = {}) {
    if (coinSet.has(symbol)) {
        return false; // Already exists in set
    }

    // Check the DOM (tiers + pool). the DOM is authoritative over coinSet
    if (coinExistsInDOM(symbol)) {
        return false;
    }

    // Store coin data
    customCoinData[symbol] = {
        logo: sanitizeLogoUrl(coinData.image || coinData.large || coinData.thumb || ''),
        name: sanitizeCoinName(coinData.name || ''),
        id: sanitizeCoinName(coinData.id || '')
    };

    // Add to coins array and set
    coins.push(symbol);
    coinSet.add(symbol);

    const coinEl = createCoinElement(symbol, 0);
    if (!coinEl) {
        coins.pop();
        coinSet.delete(symbol);
        delete customCoinData[symbol];
        return false;
    }
    coinContainer.appendChild(coinEl);
    revealTray();

    saveToLocalStorage();
    if (!customCoinData[symbol].logo) backfillMissingLogos([symbol]);
    if (!options.quiet) announceToScreenReader(`${symbol} added to Unranked`);
    return true;
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

// Keep the tray's empty state and counts in sync with its contents.
// Must be called whenever a coin is added, removed or moved.
function updatePoolEmptyState() {
    const existing = coinContainer.querySelector('.pool-empty-state');
    const poolCoins = coinContainer.querySelectorAll('.coin').length;

    if (poolCoins === 0) {
        const message = coins.length === 0
            ? 'Search for a coin or browse a category above. New coins wait here until you rank them.'
            : '<strong>Everything is ranked.</strong> Add more coins above, or drag one back here.';
        if (!existing) {
            const empty = document.createElement('div');
            empty.className = 'pool-empty-state';
            empty.innerHTML = message;
            coinContainer.appendChild(empty);
        } else if (existing.innerHTML !== message) {
            existing.innerHTML = message;
        }
    } else if (existing) {
        existing.remove();
    }

    updatePoolCounts(poolCoins);
}

function updatePoolCounts(poolCoins) {
    const count = typeof poolCoins === 'number' ? poolCoins : coinContainer.querySelectorAll('.coin').length;
    const pill = document.getElementById('poolCount');
    if (pill && pill.textContent !== String(count)) {
        pill.textContent = count;
        pill.setAttribute('aria-label', `${count} unranked coin${count === 1 ? '' : 's'}`);
        pill.classList.remove('bump');
        void pill.offsetWidth; // restart the animation
        pill.classList.add('bump');
    }
    const unranked = document.getElementById('unrankedTotal');
    if (unranked) unranked.textContent = count;
}

// Create coin element
function createCoinElement(coinName, index) {
    // SECURITY: Sanitize coin name
    const safeCoinName = sanitizeCoinName(coinName);
    if (!safeCoinName) {
        console.error('Invalid coin name');
        return null;
    }

    const coinFullName = customCoinData[safeCoinName]?.name || safeCoinName;
    const coinEl = document.createElement('div');
    coinEl.className = 'coin';
    coinEl.draggable = true;
    coinEl.dataset.coin = safeCoinName;
    coinEl.tabIndex = 0; // Make focusable for keyboard navigation
    coinEl.title = coinFullName === safeCoinName ? safeCoinName : `${coinFullName} (${safeCoinName})`;
    coinEl.setAttribute('role', 'button');
    coinEl.setAttribute('aria-label', `${safeCoinName} coin. Press Enter to pick up and move.`);

    // Create logo image (real logo from CoinGecko, monogram until it loads)
    const logo = document.createElement('img');
    logo.className = 'coin-logo';
    // NOTE: Don't set crossOrigin for display - CoinGecko doesn't support CORS hotlinking
    logo.draggable = false; // Prevent logo from being draggable separately
    logo.loading = 'lazy'; // PERFORMANCE: Native lazy loading
    logo.decoding = 'async'; // PERFORMANCE: Async image decoding
    logo.referrerPolicy = 'no-referrer'; // Help with hotlink protection
    logo.alt = `${coinFullName} (${safeCoinName}) logo`;
    setLogoImage(logo, safeCoinName, customCoinData[safeCoinName]?.logo);

    // Create text span
    const text = document.createElement('span');
    text.className = 'coin-text';
    text.textContent = safeCoinName;

    // Create remove button with double-tap confirmation
    const removeBtn = document.createElement('button');
    removeBtn.className = 'coin-remove';
    removeBtn.type = 'button';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = 'Remove coin';
    removeBtn.setAttribute('aria-label', `Remove ${safeCoinName}`);
    removeBtn.tabIndex = -1;

    const handleRemoveClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (removeBtn.classList.contains('confirm')) {
            removeCoin(safeCoinName);
        } else {
            // First tap - show confirmation state
            removeBtn.classList.add('confirm');
            removeBtn.textContent = 'Remove?';
            // Reset after 2 seconds if not confirmed
            setTimeout(() => {
                removeBtn.classList.remove('confirm');
                removeBtn.innerHTML = '&times;';
            }, 2000);
        }
    };

    removeBtn.addEventListener('click', handleRemoveClick);
    removeBtn.addEventListener('mousedown', (e) => e.stopPropagation());

    coinEl.appendChild(logo);
    coinEl.appendChild(text);
    coinEl.appendChild(removeBtn);

    // Drag events
    coinEl.addEventListener('dragstart', handleDragStart);
    coinEl.addEventListener('dragend', handleDragEnd);

    // Touch: press and hold to drag, so a swipe that starts on a coin still scrolls
    coinEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    coinEl.addEventListener('touchmove', handleTouchMove, { passive: false });
    coinEl.addEventListener('touchend', handleTouchEnd, { passive: false });
    coinEl.addEventListener('touchcancel', handleTouchCancel);
    coinEl.addEventListener('contextmenu', (e) => e.preventDefault());

    // Click or tap: choose a tier from the picker
    coinEl.addEventListener('click', handleCoinClick);

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

        searchTimeout = setTimeout(() => searchCoins(query), 150);
    });

    // Enter adds the top search result (or the typed ticker), arrows walk the results
    coinInput.addEventListener('keydown', (e) => {
        const items = Array.from(searchResults.querySelectorAll('.search-item:not(.no-results)'))
            .filter(item => item.dataset.selectable === '1');
        const resultsOpen = searchResults.style.display === 'block';
        if (e.key === 'Enter') {
            e.preventDefault();
            if (resultsOpen && items.length > 0) {
                items[0].click();
            } else {
                addCoin();
            }
        } else if (e.key === 'ArrowDown' && resultsOpen && items.length > 0) {
            e.preventDefault();
            items[0].focus();
        } else if (e.key === 'Escape' && resultsOpen) {
            e.preventDefault();
            searchResults.style.display = 'none';
            coinInput.setAttribute('aria-expanded', 'false');
        }
    });

    // Arrow keys move between search results
    searchResults.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Escape') return;
        const items = Array.from(searchResults.querySelectorAll('.search-item[data-selectable="1"]'));
        const index = items.indexOf(document.activeElement);
        e.preventDefault();
        if (e.key === 'Escape') {
            searchResults.style.display = 'none';
            coinInput.setAttribute('aria-expanded', 'false');
            coinInput.focus();
        } else if (e.key === 'ArrowDown') {
            items[Math.min(index + 1, items.length - 1)]?.focus();
        } else if (index <= 0) {
            coinInput.focus();
        } else {
            items[index - 1]?.focus();
        }
    });

    // Help button and dialog close
    document.getElementById('helpBtn')?.addEventListener('click', openHelpModal);
    document.querySelector('[data-close-help]')?.addEventListener('click', closeHelpModal);

    // While dragging with a mouse, scroll the page near the top and bottom edges
    document.addEventListener('dragover', (e) => {
        if (draggedElement) autoScrollForPointer(e.clientX, e.clientY, true);
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

    // Help dialog: clicking the backdrop closes it
    const helpModal = document.getElementById('helpModal');
    if (helpModal) {
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) closeHelpModal();
        });
    }

    // Command palette wiring
    setupCommandPalette();

    // Clear all tiers - move coins back to the Unranked tray
    clearBtn.addEventListener('click', () => {
        closeMenus();
        closeTierPicker();
        const ranked = document.querySelectorAll('.tier-content .coin').length;
        if (ranked === 0) {
            showNotification('Nothing is ranked yet.');
            return;
        }

        cancelKeyboardSelection();
        tierContents.forEach(tier => {
            tier.innerHTML = ''; // Clear the tier
        });

        // Re-render the tray, which now includes every coin
        renderCoins();
        revealTray();

        saveToLocalStorage();
        showNotification(`Moved ${ranked} coin${ranked === 1 ? '' : 's'} back to Unranked.`);
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
        closeMenus();
        closeTierPicker();
        showConfirmModal('Remove every coin and clear all tiers? Your custom tier names stay.', () => {
            cancelKeyboardSelection();
            coins = [];
            coinSet = new Set();
            customCoinData = {};
            tierContents.forEach(tier => tier.innerHTML = '');
            closeCatalog();
            renderCoins();
            saveToLocalStorage();
            showNotification('Started over. Add coins to build a new list.');
        }, { confirmLabel: 'Start over', danger: true });
    });

    // Degen mode toggle
    degenToggle.addEventListener('click', toggleDegenMode);

    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Drop zones: a whole tier row (label included) and the whole Unranked tray
    const dropZones = [...document.querySelectorAll('.tier-row'), trayEl].filter(Boolean);
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('drop', handleDrop);
        zone.addEventListener('dragleave', handleDragLeave);
        zone.addEventListener('dragenter', handleDragEnter);
    });
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
let coinIndexReady = Promise.resolve();

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
        resultItem.dataset.selectable = '1';
        resultItem.tabIndex = 0;

        const logo = document.createElement('img');
        logo.decoding = 'async'; // PERFORMANCE: Async image decoding
        logo.referrerPolicy = 'no-referrer'; // Help with hotlink protection
        // ACCESSIBILITY: Descriptive alt text
        logo.alt = `${coin.name} (${coin.symbol.toUpperCase()}) logo`;
        logo.className = 'search-logo';
        // SECURITY: setLogoImage sanitizes the URL from the API response
        setLogoImage(logo, sanitizeCoinName(coin.symbol.toUpperCase()), coin.large || coin.thumb || '');

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

        // Click covers taps too, so scrolling the results on a phone never adds a coin
        resultItem.addEventListener('click', handleSelect);
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

// Find a coin in the local index (or the curated lists) by exact ticker or name
function findKnownCoin(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return null;
    const curated = findStaticCoin(q.toUpperCase());
    if (curated) return { symbol: curated.symbol, name: curated.name, id: curated.id, logo: curated.image };
    if (!coinIndex) return null;
    const hit = coinIndex.find(c => c.symbol.toLowerCase() === q) ||
        coinIndex.find(c => c.name.toLowerCase() === q);
    return hit ? { symbol: hit.symbol, name: hit.name, id: hit.id, logo: hit.large } : null;
}

// Add custom coin
function addCoin() {
    const typed = coinInput.value.trim();
    // Typed without picking a result: use the best known match so the coin
    // arrives with its real name and logo
    const picked = selectedCoin || findKnownCoin(typed);
    const rawSymbol = picked ? picked.symbol : typed.toUpperCase();
    // SECURITY: Sanitize coin symbol
    const coinSymbol = sanitizeCoinName(String(rawSymbol).toUpperCase());

    if (!coinSymbol) {
        showNotification('Type a coin name or ticker to add it.', 'warning');
        coinInput.focus();
        coinInput.classList.add('input-highlight');
        setTimeout(() => coinInput.classList.remove('input-highlight'), 2000);
        return;
    }

    // PERFORMANCE: O(1) lookup using Set instead of Array.includes + DOM query
    // Also check the DOM (any tier or the tray), which is authoritative
    if (coinSet.has(coinSymbol) || document.querySelector(`.coin[data-coin="${escapeSelector(coinSymbol)}"]`)) {
        coinSet.add(coinSymbol);
        showNotification(`${coinSymbol} is already on your list.`, 'warning');
        coinInput.value = '';
        selectedCoin = null;
        flashCoin(coinSymbol);
        return;
    }

    // Store coin data from the search result or the known-coin match
    // SECURITY: Validate logo URL before storing
    if (picked) {
        customCoinData[coinSymbol] = {
            logo: sanitizeLogoUrl(picked.logo || ''),
            name: sanitizeCoinName(picked.name || ''),
            id: sanitizeCoinName(picked.id || '')
        };
    }

    coins.push(coinSymbol);
    coinSet.add(coinSymbol); // PERFORMANCE: Keep Set in sync
    const coinEl = createCoinElement(coinSymbol, coins.length - 1);
    // SECURITY: Only append if valid element was created
    if (!coinEl) {
        coins.pop(); // Remove from array if element creation failed
        coinSet.delete(coinSymbol); // PERFORMANCE: Keep Set in sync
        showNotification('Could not add that coin.', 'error');
        return;
    }
    coinContainer.appendChild(coinEl);
    revealTray();
    coinInput.value = '';
    selectedCoin = null;
    searchResults.style.display = 'none';
    coinInput.setAttribute('aria-expanded', 'false');

    saveToLocalStorage();
    announceToScreenReader(`${coinSymbol} added to Unranked`);

    // Coins typed by ticker alone get their logo from CoinGecko's free API
    if (!customCoinData[coinSymbol] || !customCoinData[coinSymbol].logo) {
        backfillMissingLogos([coinSymbol]);
    }
    if (openCatalogCategory) renderCatalog();
}

// Briefly highlight a coin that is already on the board or in the tray
function flashCoin(symbol) {
    const el = document.querySelector(`.coin[data-coin="${escapeSelector(symbol)}"]`);
    if (!el) return;
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    el.classList.add('is-picking');
    setTimeout(() => el.classList.remove('is-picking'), 1200);
}

// Remove coin from the list
function removeCoin(coinSymbol) {
    const safeCoinName = sanitizeCoinName(coinSymbol);
    if (!safeCoinName || !coinSet.has(safeCoinName)) {
        return;
    }

    // Find where the coin currently is (coin pool or which tier)
    const coinEl = document.querySelector(`.coin[data-coin="${escapeSelector(safeCoinName)}"]`);
    let location = 'pool';
    if (coinEl) {
        const tierContent = coinEl.closest('.tier-content');
        if (tierContent) {
            location = tierContent.dataset.tier;
        }
        if (pickerCoin === coinEl) closeTierPicker();
        if (keyboardSelectedCoin === coinEl) {
            coinEl.classList.remove('keyboard-selected');
            keyboardSelectedCoin = null;
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

    // Take the coin out right away so counts, saves and re-adds see the new
    // state, and fade out a detached copy in its place
    if (coinEl) {
        fadeOutCoinGhost(coinEl);
        coinEl.remove();
    }

    saveToLocalStorage();
    if (openCatalogCategory) renderCatalog();
    showUndoToast(safeCoinName);
}

// A purely visual copy of a removed coin that fades where the coin was
function fadeOutCoinGhost(coinEl) {
    const rect = coinEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ghost = coinEl.cloneNode(true);
    ghost.removeAttribute('data-coin');
    ghost.removeAttribute('tabindex');
    ghost.removeAttribute('role');
    ghost.removeAttribute('aria-label');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.classList.remove('is-picking', 'keyboard-selected', 'dragging', 'drag-source');
    ghost.classList.add('removing');
    ghost.style.cssText = `position: fixed; left: ${rect.left}px; top: ${rect.top}px; width: ${rect.width}px; height: ${rect.height}px; margin: 0; z-index: 60; pointer-events: none;`;
    document.body.appendChild(ghost);
    setTimeout(() => ghost.remove(), 350);
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
    undoBtn.type = 'button';
    undoBtn.textContent = 'Undo';
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

    // Re-added by hand in the meantime: nothing to restore
    if (coinSet.has(symbol) || coinExistsInDOM(symbol)) {
        lastRemovedCoin = null;
        clearTimeout(undoTimeout);
        return;
    }

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
    const tierContent = location !== 'pool' && isValidTierName(location)
        ? tierElementCache[location]?.content
        : null;
    if (tierContent) {
        tierContent.appendChild(coinEl);
    } else {
        coinContainer.appendChild(coinEl);
        revealTray();
    }

    saveToLocalStorage();
    if (openCatalogCategory) renderCatalog();
    announceToScreenReader(`${symbol} restored`);
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

// Custom confirmation dialog. options: { confirmLabel, cancelLabel, danger }
function showConfirmModal(message, onConfirm, options = {}) {
    // Remove existing modal if any
    const existingModal = document.querySelector('.confirm-modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }

    const returnFocusTo = document.activeElement;

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'confirm-modal-overlay';

    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.setAttribute('role', 'alertdialog');
    modal.setAttribute('aria-modal', 'true');

    const messageEl = document.createElement('p');
    messageEl.className = 'confirm-modal-message';
    messageEl.id = 'confirmModalMessage';
    messageEl.textContent = message;
    modal.setAttribute('aria-describedby', messageEl.id);

    const buttons = document.createElement('div');
    buttons.className = 'confirm-modal-buttons';

    const close = (after) => {
        document.removeEventListener('keydown', handleKeys, true);
        overlay.classList.add('hiding');
        setTimeout(() => {
            overlay.remove();
            if (returnFocusTo && document.contains(returnFocusTo) && typeof returnFocusTo.focus === 'function') {
                returnFocusTo.focus({ preventScroll: true });
            }
            if (after) after();
        }, 200);
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'confirm-modal-btn cancel';
    cancelBtn.textContent = options.cancelLabel || 'Cancel';
    cancelBtn.addEventListener('click', () => close());

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'confirm-modal-btn confirm' + (options.danger ? ' danger' : '');
    confirmBtn.textContent = options.confirmLabel || 'Confirm';
    confirmBtn.addEventListener('click', () => close(onConfirm));

    buttons.appendChild(cancelBtn);
    buttons.appendChild(confirmBtn);
    modal.appendChild(messageEl);
    modal.appendChild(buttons);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Trigger animation, and start on the safe choice
    requestAnimationFrame(() => {
        overlay.classList.add('visible');
        (options.danger ? cancelBtn : confirmBtn).focus({ preventScroll: true });
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    // Escape closes; Tab stays inside the dialog
    function handleKeys(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            close();
        } else if (e.key === 'Tab') {
            e.preventDefault();
            (document.activeElement === cancelBtn ? confirmBtn : cancelBtn).focus();
        }
    }
    document.addEventListener('keydown', handleKeys, true);
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

// Remove duplicate coins from a container (keeps the moved coin, removes others with same symbol)
function removeDuplicateCoins(container, movedCoin) {
    if (!container || !movedCoin) return;

    const movedSymbol = movedCoin.dataset.coin;
    const allCoins = container.querySelectorAll('.coin');

    allCoins.forEach(coin => {
        // Remove any other coin with the same symbol (not the one we just moved)
        if (coin !== movedCoin && coin.dataset.coin === movedSymbol) {
            coin.remove();
            showNotification(`Removed a duplicate ${movedSymbol}.`, 'warning');
        }
    });
}

// The drop zone for an element: a tier (anywhere on its row, label included)
// or the Unranked tray (anywhere on the tray, header included)
function getDropZone(el) {
    if (!el || !el.closest) return null;
    const row = el.closest('.tier-row');
    if (row) return row.querySelector('.tier-content');
    if (el.closest('#tray')) return coinContainer;
    return null;
}

function setHighlightedZone(zone) {
    if (zone === currentHighlightedZone) return;
    if (currentHighlightedZone) currentHighlightedZone.classList.remove('drag-over');
    if (zone) zone.classList.add('drag-over');
    currentHighlightedZone = zone;
}

// Put a coin into a tier or the tray, honoring the insertion indicator
function placeCoin(coinEl, dropTarget) {
    if (!coinEl || !dropTarget) return;
    if (insertionTarget && insertionTarget !== coinEl && insertionTarget.parentNode === dropTarget) {
        if (insertionPosition === 'before') {
            dropTarget.insertBefore(coinEl, insertionTarget);
        } else {
            dropTarget.insertBefore(coinEl, insertionTarget.nextSibling);
        }
    } else if (coinEl.parentNode !== dropTarget) {
        // Default: append to end
        dropTarget.appendChild(coinEl);
    } else {
        return; // Dropped back where it was
    }

    // Remove any duplicate coins in the target container
    removeDuplicateCoins(dropTarget, coinEl);

    // Trigger confetti for S-tier drops!
    if (dropTarget.dataset.tier === 'S') {
        triggerSTierConfetti(dropTarget);
    }

    saveToLocalStorage();
    announceToScreenReader(dropTarget === coinContainer
        ? `${coinEl.dataset.coin} moved to Unranked`
        : `${coinEl.dataset.coin} ranked ${dropTarget.dataset.tier}`);
}

// Move a coin with the tier picker or the palette ('pool' sends it back to Unranked)
function moveCoinTo(coinEl, tier) {
    const target = tier === 'pool' ? coinContainer : tierElementCache[tier]?.content;
    if (!coinEl || !target || coinEl.parentElement === target) return;
    clearInsertionIndicator();
    placeCoin(coinEl, target);
}

// Wide screens show the tray as a column beside the board (see style.css)
const TRAY_SIDEBAR_QUERY = window.matchMedia('(min-width: 1100px)');
function isTraySidebar() {
    return TRAY_SIDEBAR_QUERY.matches;
}

// Scroll the page while a dragged coin is held near the top or bottom of the
// screen (just above the tray when it is docked). Edge scrolling only starts
// once the coin has been in the middle of the screen, so lifting a coin out of
// the tray (or out of the top tier) does not scroll the board away.
// Returns the distance scrolled.
let autoScrollArmed = false;

function autoScrollForPointer(clientX, clientY, perEvent) {
    const vh = window.innerHeight;
    const edge = Math.min(96, vh * 0.13);
    let bottomLimit = vh;
    if (trayEl) {
        const r = trayEl.getBoundingClientRect();
        // Over the tray: the user is dropping there
        if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) return 0;
        if (!isTraySidebar() && r.top < vh) bottomLimit = r.top;
    }
    const inTopBand = clientY < edge;
    const inBottomBand = clientY > bottomLimit - edge;
    if (!inTopBand && !inBottomBand) {
        autoScrollArmed = true;
        return 0;
    }
    if (!autoScrollArmed) return 0;
    const divisor = perEvent ? 3 : 7;
    const cap = perEvent ? 30 : 14;
    let dy = 0;
    if (inTopBand) {
        dy = -Math.ceil((edge - clientY) / divisor);
    } else {
        dy = Math.ceil((clientY - (bottomLimit - edge)) / divisor);
    }
    dy = Math.max(-cap, Math.min(cap, dy));
    if (dy) window.scrollBy(0, dy);
    return dy;
}

// Drag handlers (mouse, HTML5 drag and drop)
function handleDragStart(e) {
    draggedElement = e.currentTarget;
    autoScrollArmed = false;
    closeTierPicker();
    closeCatalog();
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    // SECURITY: Use text/plain with sanitized coin name instead of innerHTML
    e.dataTransfer.setData('text/plain', sanitizeCoinName(e.currentTarget.dataset.coin || ''));
}

function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    setHighlightedZone(null);
    clearInsertionIndicator();
    draggedElement = null;
}

function handleDragOver(e) {
    if (!draggedElement) return; // Ignore files and text dragged in from elsewhere
    const zone = getDropZone(e.target);
    if (!zone) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHighlightedZone(zone);

    // Detect insertion position for reordering
    updateInsertionIndicator(e.clientX, e.clientY, e.target);
}

function handleDragEnter(e) {
    if (!draggedElement) return;
    const zone = getDropZone(e.target);
    if (zone) setHighlightedZone(zone);
}

function handleDragLeave(e) {
    const zone = getDropZone(e.target);
    if (zone && zone === currentHighlightedZone && getDropZone(e.relatedTarget) !== zone) {
        setHighlightedZone(null);
        clearInsertionIndicator();
    }
}

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();

    const dropTarget = getDropZone(e.target);
    if (draggedElement && dropTarget) {
        placeCoin(draggedElement, dropTarget);
    }
    setHighlightedZone(null);
    clearInsertionIndicator();
    return false;
}

// Touch: press and hold a coin to pick it up. A swipe that starts on a coin
// scrolls the page as usual, and a quick tap opens the tier picker.
const LONG_PRESS_MS = 260;
const TOUCH_SLOP = 10;
let touchState = null;
let suppressClickUntil = 0;
let lastDragPoint = null;
let autoScrollRafId = null;

function handleTouchStart(e) {
    if (e.target.closest('.coin-remove')) return;
    if (e.touches.length !== 1) {
        cancelTouchPress();
        return;
    }
    const touch = e.touches[0];
    cancelTouchPress();
    touchState = {
        coinEl: e.currentTarget,
        startX: touch.clientX,
        startY: touch.clientY,
        lastX: touch.clientX,
        lastY: touch.clientY,
        dragging: false,
        timer: 0
    };
    touchState.timer = setTimeout(beginTouchDrag, LONG_PRESS_MS);
}

function beginTouchDrag() {
    if (!touchState || touchState.dragging) return;
    const { coinEl, lastX, lastY } = touchState;
    touchState.dragging = true;
    draggedElement = coinEl;
    autoScrollArmed = false;
    closeTierPicker();
    closeCatalog();

    // Create a visual clone for dragging
    touchClone = coinEl.cloneNode(true);
    touchClone.classList.remove('dragging', 'keyboard-selected', 'is-picking');
    touchClone.classList.add('touch-dragging');
    touchClone.removeAttribute('tabindex');
    touchClone.setAttribute('aria-hidden', 'true');
    touchClone.style.position = 'fixed';
    touchClone.style.width = `${coinEl.offsetWidth}px`;
    touchClone.style.left = `${lastX - coinEl.offsetWidth / 2}px`;
    touchClone.style.top = `${lastY - coinEl.offsetHeight / 2}px`;
    document.body.appendChild(touchClone);

    coinEl.classList.add('drag-source');
    document.body.classList.add('is-touch-dragging');
    if (navigator.vibrate) {
        try { navigator.vibrate(12); } catch (_) {}
    }
    lastDragPoint = { x: lastX, y: lastY };
    startAutoScroll();
    updateTouchDropTarget(lastX, lastY);
}

// PERFORMANCE: RAF-coalesced touch move handler
function handleTouchMove(e) {
    if (!touchState) return;
    const touch = e.touches[0];
    touchState.lastX = touch.clientX;
    touchState.lastY = touch.clientY;

    if (!touchState.dragging) {
        // Moving before the hold completes is a scroll, not a drag
        if (Math.abs(touch.clientX - touchState.startX) > TOUCH_SLOP ||
            Math.abs(touch.clientY - touchState.startY) > TOUCH_SLOP) {
            clearTimeout(touchState.timer);
            touchState = null;
        }
        return;
    }

    e.preventDefault();
    // Latch the latest touch coordinates; the RAF callback will use whichever is most recent.
    pendingTouchEvent = { clientX: touch.clientX, clientY: touch.clientY };
    lastDragPoint = { x: touch.clientX, y: touch.clientY };
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
    updateTouchDropTarget(evt.clientX, evt.clientY);
}

// Highlight the zone and insertion point under the finger
function updateTouchDropTarget(x, y) {
    if (touchClone) touchClone.style.display = 'none';
    const below = document.elementFromPoint(x, y);
    if (touchClone) touchClone.style.display = '';

    const zone = getDropZone(below);
    setHighlightedZone(zone);

    let target = null;
    let position = null;
    const coinBelow = zone && below ? below.closest('.coin') : null;
    if (coinBelow && coinBelow !== draggedElement && !coinBelow.classList.contains('touch-dragging')) {
        const rect = coinBelow.getBoundingClientRect();
        target = coinBelow;
        position = x < rect.left + rect.width / 2 ? 'before' : 'after';
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
    if (!touchState) return;
    clearTimeout(touchState.timer);
    const wasDragging = touchState.dragging;
    touchState = null;
    if (!wasDragging) return; // A tap: the click that follows opens the tier picker

    e.preventDefault();
    suppressClickUntil = Date.now() + 450;
    const touch = e.changedTouches && e.changedTouches[0];
    endTouchDrag(touch ? { x: touch.clientX, y: touch.clientY } : null);
}

function handleTouchCancel() {
    cancelTouchPress();
}

function cancelTouchPress() {
    if (!touchState) return;
    clearTimeout(touchState.timer);
    const wasDragging = touchState.dragging;
    touchState = null;
    if (wasDragging) endTouchDrag(null);
}

function endTouchDrag(point) {
    stopAutoScroll();
    if (touchMoveRafId !== null) {
        cancelAnimationFrame(touchMoveRafId);
        touchMoveRafId = null;
    }

    let dropTarget = null;
    if (point) {
        if (touchClone) touchClone.style.display = 'none';
        dropTarget = getDropZone(document.elementFromPoint(point.x, point.y));
    }
    if (dropTarget && draggedElement) {
        placeCoin(draggedElement, dropTarget);
    }

    if (draggedElement) draggedElement.classList.remove('drag-source');
    if (touchClone) {
        touchClone.remove();
        touchClone = null;
    }
    document.body.classList.remove('is-touch-dragging');
    setHighlightedZone(null);
    clearInsertionIndicator();
    draggedElement = null;
    lastDragPoint = null;
}

function startAutoScroll() {
    stopAutoScroll();
    const step = () => {
        if (!lastDragPoint) return;
        if (autoScrollForPointer(lastDragPoint.x, lastDragPoint.y, false)) {
            updateTouchDropTarget(lastDragPoint.x, lastDragPoint.y);
        }
        autoScrollRafId = requestAnimationFrame(step);
    };
    autoScrollRafId = requestAnimationFrame(step);
}

function stopAutoScroll() {
    if (autoScrollRafId) cancelAnimationFrame(autoScrollRafId);
    autoScrollRafId = null;
}

// Click or tap on a coin opens the tier picker next to it
function handleCoinClick(e) {
    if (Date.now() < suppressClickUntil) return;
    if (e.target.closest('.coin-remove')) return;
    const coinEl = e.currentTarget;
    if (pickerCoin === coinEl && tierPickerEl && !tierPickerEl.hidden) {
        closeTierPicker();
        return;
    }
    openTierPicker(coinEl);
}

// ============================================
// TIER PICKER: tap a coin, then tap a tier
// ============================================

let pickerCoin = null;

function setupTierPicker() {
    if (!tierPickerEl) return;

    tierPickerEl.querySelectorAll('.pick[data-tier]').forEach(btn => {
        btn.addEventListener('click', () => {
            const coinEl = pickerCoin;
            closeTierPicker();
            if (coinEl) moveCoinTo(coinEl, btn.dataset.tier);
        });
    });

    document.getElementById('tierPickerPool')?.addEventListener('click', () => {
        const coinEl = pickerCoin;
        closeTierPicker();
        if (coinEl) moveCoinTo(coinEl, 'pool');
    });

    document.getElementById('tierPickerRemove')?.addEventListener('click', () => {
        const coinEl = pickerCoin;
        closeTierPicker();
        if (coinEl) removeCoin(coinEl.dataset.coin);
    });

    document.getElementById('tierPickerClose')?.addEventListener('click', () => closeTierPicker(true));

    tierPickerEl.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            closeTierPicker(true);
        } else if (pickerCoin && (TIER_NUMBER_MAP[e.key] || e.key === '0')) {
            e.preventDefault();
            const coinEl = pickerCoin;
            closeTierPicker(true);
            moveCoinTo(coinEl, e.key === '0' ? 'pool' : TIER_NUMBER_MAP[e.key]);
        }
    });

    // Clicking anywhere else closes it
    document.addEventListener('click', (e) => {
        if (!pickerCoin) return;
        if (e.target.closest('#tierPicker') || e.target.closest('.coin') === pickerCoin) return;
        closeTierPicker();
    });

    const reposition = rafThrottle(positionTierPicker);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, { passive: true });
    coinContainer.addEventListener('scroll', reposition, { passive: true });
}

function openTierPicker(coinEl) {
    if (!tierPickerEl || !coinEl) return;
    closeCatalog();
    closeMenus();
    if (pickerCoin && pickerCoin !== coinEl) pickerCoin.classList.remove('is-picking');
    pickerCoin = coinEl;
    coinEl.classList.add('is-picking');

    const symbol = coinEl.dataset.coin;
    const data = customCoinData[symbol] || {};
    const currentTier = coinEl.closest('.tier-content')?.dataset.tier || null;

    document.getElementById('tierPickerTitle').textContent = symbol;
    const nameEl = document.getElementById('tierPickerName');
    const placement = currentTier ? `In ${currentTier} tier` : 'Unranked';
    nameEl.textContent = data.name && data.name.toUpperCase() !== symbol ? `${data.name} · ${placement}` : placement;
    const logo = document.getElementById('tierPickerLogo');
    setLogoImage(logo, symbol, data.logo);

    tierPickerEl.querySelectorAll('.pick[data-tier]').forEach(btn => {
        const tier = btn.dataset.tier;
        const isCurrent = tier === currentTier;
        btn.classList.toggle('is-current', isCurrent);
        btn.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
        btn.setAttribute('aria-label', `${getTierLetter(tier)} tier, ${customTierNames[tier] || getDefaultTierName(tier)}`);
        btn.title = customTierNames[tier] || getDefaultTierName(tier);
        const letter = btn.querySelector('.pick-letter');
        if (letter) letter.textContent = getTierLetter(tier);
    });
    const poolBtn = document.getElementById('tierPickerPool');
    if (poolBtn) poolBtn.hidden = !currentTier;

    tierPickerEl.hidden = false;
    positionTierPicker();

    // Keyboard and screen-reader users land on the first tier
    const first = tierPickerEl.querySelector('.pick:not(.is-current)');
    if (first && (document.activeElement === coinEl || window.matchMedia('(hover: none)').matches)) {
        first.focus({ preventScroll: true });
    }
}

function closeTierPicker(returnFocus) {
    if (!tierPickerEl) return;
    const coinEl = pickerCoin;
    pickerCoin = null;
    if (!tierPickerEl.hidden) tierPickerEl.hidden = true;
    if (coinEl) {
        coinEl.classList.remove('is-picking');
        if (returnFocus && document.contains(coinEl)) coinEl.focus({ preventScroll: true });
    }
}

function positionTierPicker() {
    if (!pickerCoin || !tierPickerEl || tierPickerEl.hidden) return;
    if (!document.contains(pickerCoin)) {
        closeTierPicker();
        return;
    }
    // Phones get a bottom sheet from CSS
    if (window.matchMedia('(max-width: 640px)').matches) {
        tierPickerEl.style.left = '';
        tierPickerEl.style.top = '';
        return;
    }
    const rect = pickerCoin.getBoundingClientRect();
    const width = tierPickerEl.offsetWidth;
    const height = tierPickerEl.offsetHeight;
    const margin = 10;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const inTray = Boolean(pickerCoin.closest('#tray'));
    let left;
    let top;

    if (inTray && isTraySidebar()) {
        // Coins in the side column: open beside the column, level with the coin
        left = trayEl.getBoundingClientRect().left - width - 12;
        top = rect.top + rect.height / 2 - height / 2;
    } else {
        // Below the coin when there is room above the docked tray, otherwise above it
        left = rect.left + rect.width / 2 - width / 2;
        const trayTop = trayEl && !isTraySidebar() ? trayEl.getBoundingClientRect().top : vh;
        const bottomLimit = inTray ? vh : Math.min(vh, trayTop);
        top = rect.bottom + 8;
        if (inTray || top + height > bottomLimit - margin) {
            top = rect.top - height - 8;
        }
    }
    left = Math.max(margin, Math.min(left, vw - width - margin));
    top = Math.max(margin, Math.min(top, vh - height - margin));

    tierPickerEl.style.left = `${Math.round(left + window.scrollX)}px`;
    tierPickerEl.style.top = `${Math.round(top + window.scrollY)}px`;
}

// ============================================
// MENUS AND THE TRAY
// ============================================

function setupMenus() {
    const btn = document.getElementById('moreBtn');
    const menu = document.getElementById('moreMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = menu.hidden;
        closeMenus();
        if (willOpen) {
            closeTierPicker();
            menu.hidden = false;
            btn.setAttribute('aria-expanded', 'true');
            menu.querySelector('.menu-item')?.focus();
        }
    });

    menu.addEventListener('keydown', (e) => {
        const items = Array.from(menu.querySelectorAll('.menu-item'));
        const index = items.indexOf(document.activeElement);
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            closeMenus();
            btn.focus();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            items[(index + 1) % items.length]?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            items[(index - 1 + items.length) % items.length]?.focus();
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.menu-wrap')) closeMenus();
    });
}

function closeMenus() {
    const btn = document.getElementById('moreBtn');
    const menu = document.getElementById('moreMenu');
    if (menu && !menu.hidden) menu.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
}

const TRAY_PREF_KEY = 'martinezAccessTierListTrayCollapsed';

function setupTray() {
    const toggle = document.getElementById('trayToggle');
    if (!toggle || !trayEl) return;
    let collapsed = false;
    try {
        collapsed = localStorage.getItem(TRAY_PREF_KEY) === '1';
    } catch (_) {}
    applyTrayCollapsed(collapsed);

    toggle.addEventListener('click', () => {
        const next = !trayEl.classList.contains('is-collapsed');
        applyTrayCollapsed(next);
        try {
            localStorage.setItem(TRAY_PREF_KEY, next ? '1' : '0');
        } catch (_) {}
    });

    const updateCompact = rafThrottle(updateTrayCompact);
    window.addEventListener('scroll', updateCompact, { passive: true });
    window.addEventListener('resize', updateCompact);
    updateTrayCompact();
}

// The docked tray stays one row tall until the board scrolls into view, so it
// never covers the top of the page
function updateTrayCompact() {
    if (!trayEl) return;
    const board = document.getElementById('tierBoard');
    const compact = !isTraySidebar() && board && board.getBoundingClientRect().top > window.innerHeight * 0.45;
    trayEl.classList.toggle('is-compact', Boolean(compact));
}

function applyTrayCollapsed(collapsed) {
    if (!trayEl) return;
    trayEl.classList.toggle('is-collapsed', collapsed);
    const toggle = document.getElementById('trayToggle');
    if (!toggle) return;
    const label = collapsed ? 'Show unranked coins' : 'Hide unranked coins';
    toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
}

// New coins should be visible, so adding one opens a collapsed tray
function revealTray() {
    if (trayEl && trayEl.classList.contains('is-collapsed')) applyTrayCollapsed(false);
}

// ============================================
// LOGOS: real coin logos from CoinGecko's free API, monograms meanwhile
// ============================================

const monogramCache = new Map();

function logoHue(symbol) {
    let hash = 0;
    for (const ch of String(symbol || '?')) {
        hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    }
    return hash % 360;
}

function monogramLabel(symbol) {
    const clean = String(symbol || '?').replace(/[^A-Z0-9]/gi, '').toUpperCase() || '?';
    return clean.length > 3 ? clean.slice(0, 2) : clean;
}

// A lettered circle used until a logo loads, or when a coin has none
function monogramDataUrl(symbol) {
    const key = String(symbol || '?');
    if (monogramCache.has(key)) return monogramCache.get(key);
    const label = monogramLabel(key);
    const hue = logoHue(key);
    const size = label.length >= 3 ? 23 : 28;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="hsl(${hue},30%,32%)"/><text x="32" y="${Math.round(32 + size * 0.36)}" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="${size}" font-weight="700" fill="hsl(${hue},55%,90%)">${label}</text></svg>`;
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    monogramCache.set(key, url);
    return url;
}

// Same monogram as a PNG, for the exported image
function monogramPngDataUrl(symbol) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const hue = logoHue(symbol);
    const label = monogramLabel(symbol);
    ctx.fillStyle = `hsl(${hue}, 30%, 32%)`;
    ctx.beginPath();
    ctx.arc(64, 64, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `hsl(${hue}, 55%, 90%)`;
    ctx.font = `700 ${label.length >= 3 ? 46 : 56}px Inter, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 64, 68);
    return canvas.toDataURL('image/png');
}

// Show a coin's real logo, falling back to its monogram if it is missing or fails
function setLogoImage(img, symbol, url) {
    if (!img) return;
    const safe = sanitizeLogoUrl(url || '');
    img.onerror = function () {
        this.onerror = null;
        this.classList.add('is-monogram');
        this.src = monogramDataUrl(symbol);
    };
    if (safe) {
        img.classList.remove('is-monogram');
        if (img.getAttribute('src') !== safe) img.src = safe;
    } else {
        img.classList.add('is-monogram');
        img.src = monogramDataUrl(symbol);
    }
}

function refreshCoinLogos(symbol) {
    const data = customCoinData[symbol];
    if (!data || !data.logo) return;
    document.querySelectorAll(`.coin[data-coin="${escapeSelector(symbol)}"] .coin-logo`).forEach(img => {
        setLogoImage(img, symbol, data.logo);
        if (data.name) img.alt = `${data.name} (${symbol}) logo`;
    });
    if (pickerCoin && pickerCoin.dataset.coin === symbol) {
        setLogoImage(document.getElementById('tierPickerLogo'), symbol, data.logo);
    }
}

// Fill in logos for coins that arrived without one: first from the curated
// lists and the bundled CoinGecko index, then from CoinGecko's free public API
// (a few calls per visit, rate limited).
const LOGO_API_CALLS_PER_VISIT = 12;
let logoApiCalls = 0;
let logoBackfillRunning = false;
const logoBackfillQueue = new Set();

async function backfillMissingLogos(symbols) {
    (symbols || coins).forEach(symbol => {
        if (!customCoinData[symbol] || !customCoinData[symbol].logo) logoBackfillQueue.add(symbol);
    });
    if (logoBackfillRunning || logoBackfillQueue.size === 0) return;
    logoBackfillRunning = true;
    let changed = false;

    try {
        await coinIndexReady;

        // 1. Local data, no network
        for (const symbol of Array.from(logoBackfillQueue)) {
            const data = customCoinData[symbol];
            if ((data && data.logo) || !coinSet.has(symbol)) {
                logoBackfillQueue.delete(symbol);
                continue;
            }
            const curated = findStaticCoin(symbol);
            const indexed = coinIndex ? coinIndex.find(c => c.symbol === symbol && c.large) : null;
            const logo = curated ? curated.image : indexed ? indexed.large : '';
            if (logo) {
                customCoinData[symbol] = {
                    logo: sanitizeLogoUrl(logo),
                    name: sanitizeCoinName(data?.name || curated?.name || indexed?.name || ''),
                    id: sanitizeCoinName(data?.id || curated?.id || indexed?.id || '')
                };
                refreshCoinLogos(symbol);
                logoBackfillQueue.delete(symbol);
                changed = true;
            }
        }

        // 2a. Coins with a known CoinGecko id: one batched markets call
        const withId = Array.from(logoBackfillQueue).filter(symbol => customCoinData[symbol]?.id);
        if (withId.length > 0 && logoApiCalls < LOGO_API_CALLS_PER_VISIT) {
            logoApiCalls++;
            const ids = withId.slice(0, 50).map(symbol => customCoinData[symbol].id);
            try {
                const res = await rateLimitedFetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids.join(','))}&per_page=50&page=1`);
                if (res.ok) {
                    const rows = await res.json();
                    (Array.isArray(rows) ? rows : []).forEach(row => {
                        const symbol = withId.find(s => customCoinData[s]?.id === row.id);
                        const logo = sanitizeLogoUrl(row.image || '');
                        if (symbol && logo && customCoinData[symbol] && coinSet.has(symbol)) {
                            customCoinData[symbol].logo = logo;
                            if (!customCoinData[symbol].name) customCoinData[symbol].name = sanitizeCoinName(row.name || '');
                            refreshCoinLogos(symbol);
                            logoBackfillQueue.delete(symbol);
                            changed = true;
                        }
                    });
                }
            } catch (_) {
                // Offline or rate limited: the monogram stays
            }
        }

        // 2b. Tickers only: search CoinGecko and take the best exact match
        for (const symbol of Array.from(logoBackfillQueue)) {
            if (logoApiCalls >= LOGO_API_CALLS_PER_VISIT) break;
            logoBackfillQueue.delete(symbol); // One attempt per visit
            if (!coinSet.has(symbol) || customCoinData[symbol]?.logo) continue;
            logoApiCalls++;
            try {
                const res = await rateLimitedFetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(symbol)}`);
                if (!res.ok) continue;
                const result = await res.json();
                const hits = (result.coins || []).filter(c => String(c.symbol || '').toUpperCase() === symbol);
                hits.sort((a, b) => (a.market_cap_rank || 1e9) - (b.market_cap_rank || 1e9));
                const best = hits[0];
                const logo = best ? sanitizeLogoUrl(best.large || best.thumb || '') : '';
                if (logo && coinSet.has(symbol)) {
                    customCoinData[symbol] = {
                        logo,
                        name: sanitizeCoinName(customCoinData[symbol]?.name || best.name || ''),
                        id: sanitizeCoinName(best.id || '')
                    };
                    refreshCoinLogos(symbol);
                    changed = true;
                }
            } catch (_) {
                // Keep the monogram
            }
        }
    } finally {
        logoBackfillRunning = false;
    }

    // Opening someone else's shared link must not overwrite the visitor's saved list
    if (changed && !window.location.hash.startsWith('#share=')) {
        debouncedSave();
    }

    // Coins added while this pass was running get their own pass
    if (logoBackfillQueue.size > 0 && logoApiCalls < LOGO_API_CALLS_PER_VISIT) {
        setTimeout(() => backfillMissingLogos([]), 0);
    }
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
    sendSelectedCoinToTier(newTier);
}

// Send the selected coin back to Unranked (separate from the arrow-key tier cycle)
function sendSelectedCoinToPool() {
    if (!keyboardSelectedCoin) return;
    if (keyboardSelectedCoin.parentElement === coinContainer) return;
    const coinEl = keyboardSelectedCoin;
    moveCoinTo(coinEl, 'pool');
    revealTray();
    coinEl.focus();
}

// Send the selected coin straight to a tier
function sendSelectedCoinToTier(tier) {
    if (!keyboardSelectedCoin) return;
    if (!isValidTierName(tier)) return;
    const coinEl = keyboardSelectedCoin;
    moveCoinTo(coinEl, tier);
    coinEl.focus();
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

// Toggle Degen Mode (alternative tier letters and names)
function toggleDegenMode() {
    isDegenMode = !isDegenMode;
    updateTierLabels();
    saveToLocalStorage();
    announceToScreenReader(isDegenMode ? 'Degen labels on' : 'Degen labels off');
}

// Toggle light and dark mode
function toggleTheme() {
    isLightMode = !isLightMode;
    applyTheme();
    saveToLocalStorage();
}

// Update tier letters and names for the current mode and custom names
function updateTierLabels() {
    document.body.classList.toggle('degen-mode', isDegenMode);
    if (degenToggle) degenToggle.setAttribute('aria-pressed', isDegenMode ? 'true' : 'false');

    Object.keys(TIER_LABELS).forEach(tier => {
        const tierRow = tierElementCache[tier]?.row;
        if (!tierRow) return;
        const letterEl = tierRow.querySelector('.tier-letter');
        const nameEl = tierRow.querySelector('.tier-name');
        if (letterEl) letterEl.textContent = getTierLetter(tier);
        // Use custom name if set, otherwise use default. Leave a name that is
        // being edited alone.
        if (nameEl && !nameEl.querySelector('input')) {
            nameEl.textContent = customTierNames[tier] || getDefaultTierName(tier);
            nameEl.setAttribute('aria-label', tierNameAriaLabel(tier));
        }
    });
}

// Update the tier count badges, the board status line, the first-run helper
// and the Unranked tray. Runs after every change (saveToLocalStorage calls it).
function updateTierCounts() {
    const tiers = ['S', 'A', 'B', 'C', 'D', 'F'];
    let totalRanked = 0;

    tiers.forEach(tier => {
        const cached = tierElementCache[tier];
        if (!cached || !cached.content || !cached.badge) return;

        const count = cached.content.querySelectorAll('.coin').length;
        totalRanked += count;
        cached.badge.textContent = count;
        cached.badge.setAttribute('aria-label', `${count} coin${count !== 1 ? 's' : ''}`);
        cached.badge.classList.toggle('empty', count === 0);
        cached.content.classList.toggle('empty', count === 0);
    });

    const totalEl = document.getElementById('tierSummaryTotal');
    if (totalEl) totalEl.textContent = totalRanked;

    // Helper: only once there are coins to rank and none are ranked yet
    const helper = document.getElementById('tierHelper');
    if (helper) helper.classList.toggle('visible', totalRanked === 0 && coins.length > 0);

    updatePoolEmptyState();
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

    // Esc closes whatever is open, topmost first
    if (e.key === 'Escape') {
        const helpOpen = document.getElementById('helpModal')?.classList.contains('visible');
        const paletteOpen = document.getElementById('cmdPalette')?.classList.contains('visible');
        const menu = document.getElementById('moreMenu');
        if (helpOpen) { closeHelpModal(); e.preventDefault(); return; }
        if (paletteOpen) { closeCommandPalette(); e.preventDefault(); return; }
        if (tierPickerEl && !tierPickerEl.hidden) { closeTierPicker(true); e.preventDefault(); return; }
        if (menu && !menu.hidden) { closeMenus(); document.getElementById('moreBtn')?.focus(); e.preventDefault(); return; }
        if (openCatalogCategory) { closeCatalog(true); e.preventDefault(); return; }
        // Fall through. The coin keyboard handler manages its own Esc
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

let helpReturnFocus = null;

function openHelpModal() {
    const modal = document.getElementById('helpModal');
    if (!modal) return;
    closeTierPicker();
    closeMenus();
    helpReturnFocus = document.activeElement;
    modal.classList.add('visible');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => modal.querySelector('[data-close-help]')?.focus({ preventScroll: true }), 30);
}

function closeHelpModal() {
    const modal = document.getElementById('helpModal');
    if (!modal || !modal.classList.contains('visible')) return;
    modal.classList.remove('visible');
    modal.setAttribute('aria-hidden', 'true');
    if (helpReturnFocus && document.contains(helpReturnFocus) && typeof helpReturnFocus.focus === 'function') {
        helpReturnFocus.focus({ preventScroll: true });
    }
    helpReturnFocus = null;
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
    closeTierPicker();
    closeMenus();
    closeCatalog();
    input.value = '';
    renderCommandPaletteResults('');
    setTimeout(() => input.focus(), 50);
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

function createPaletteLogo(coin) {
    const img = document.createElement('img');
    img.alt = '';
    img.referrerPolicy = 'no-referrer';
    img.decoding = 'async';
    setLogoImage(img, coin.symbol, coin.image);
    return img;
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

        item.appendChild(createPaletteLogo(coin));

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
        item.appendChild(createPaletteLogo(coin));
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

    const symbol = sanitizeCoinName(String(coin.symbol || '').toUpperCase());
    if (!symbol) return;

    // Use the existing add flow. It handles sanitizing, dedupe and persistence
    const isNew = !coinSet.has(symbol) && !coinExistsInDOM(symbol);
    if (isNew) {
        addCoinFromCategory(symbol, coin);
    }

    closeCommandPalette();

    const coinEl = document.querySelector(`.coin[data-coin="${escapeSelector(symbol)}"]`);
    if (targetTier && isValidTierName(targetTier)) {
        if (coinEl) moveCoinTo(coinEl, targetTier);
        showNotification(`${symbol} ranked ${getTierLetter(targetTier)}.`);
    } else if (isNew) {
        showNotification(`${symbol} added to Unranked.`);
    } else {
        showNotification(`${symbol} is already on your list.`, 'warning');
        flashCoin(symbol);
    }
    if (openCatalogCategory) renderCatalog();
}

// Share to X (Twitter)
async function shareToX() {
    setButtonLoading(shareBtn, 'Preparing…');

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

            // Build the post with the URL last and truncate only the summary.
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
                showNotification('Image copied. Paste it into your post with Ctrl+V or Cmd+V.');
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

            setButtonSuccess(shareBtn, 'Opened X', 'Share on X');
        }, 'image/jpeg', 0.95);

    } catch (error) {
        console.error('Share failed:', error);
        showNotification('Could not create the image. Please try again.', 'error');
        resetButtonLoading(shareBtn, 'Share on X');
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

    // Export palette: the site's dark theme, whatever theme is on screen
    const EXPORT_BG = '#11171d';
    const EXPORT_ROW = '#161f28';
    const EXPORT_LINE = 'rgba(211, 221, 228, 0.08)';
    const EXPORT_INK = '#e6ecef';
    const EXPORT_MUTED = '#9aaab7';
    const EXPORT_TIER_INK = '#13202a';
    const EXPORT_LOGO_BG = '#23313d';

    // Create export container matching website appearance
    const exportContainer = document.createElement('div');
    exportContainer.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: ${calculatedWidth}px;
        background: ${EXPORT_BG};
        padding: 22px 22px 16px;
        font-family: 'Inter', Arial, sans-serif;
    `;

    // Header so the exported image is self-explanatory when shared
    const exportHeader = document.createElement('div');
    exportHeader.style.cssText = `
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        padding: 0 2px 16px;
    `;
    const exportTitle = document.createElement('div');
    exportTitle.style.cssText = `
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: ${EXPORT_INK};
    `;
    exportTitle.textContent = 'Crypto tier list';
    const exportBrand = document.createElement('div');
    exportBrand.style.cssText = `
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.16em;
        color: ${EXPORT_MUTED};
    `;
    exportBrand.textContent = 'MARTINEZ ACCESS';
    exportHeader.appendChild(exportTitle);
    exportHeader.appendChild(exportBrand);
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

    // Load all images in parallel; coins without a loadable logo get their monogram
    await Promise.all(allCoinsInTiers.map(async (coinName) => {
        if (customCoinData[coinName] && customCoinData[coinName].logo) {
            const dataUrl = await imageToDataURL(customCoinData[coinName].logo);
            if (dataUrl) {
                imageCache[coinName] = dataUrl;
            }
        }
        if (!imageCache[coinName]) {
            imageCache[coinName] = monogramPngDataUrl(coinName);
        }
    }));

    tierData.forEach(tier => {
        const tierContent = document.querySelector(`.tier-content[data-tier="${tier.name}"]`);
        const coins = tierContent ? Array.from(tierContent.querySelectorAll('.coin')).map(c => c.dataset.coin) : [];

        const row = document.createElement('div');
        row.style.cssText = `
            display: flex;
            width: 100%;
            margin-bottom: 6px;
            border-radius: 10px;
            overflow: hidden;
            background: ${EXPORT_ROW};
            border: 1px solid ${EXPORT_LINE};
            min-height: 88px;
        `;

        const label = document.createElement('div');
        label.style.cssText = `
            width: 112px;
            min-width: 112px;
            background: ${tier.color};
            padding: 10px 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: ${EXPORT_TIER_INK};
        `;

        const letterDiv = document.createElement('div');
        letterDiv.style.cssText = `
            font-family: 'Inter', Arial, sans-serif;
            font-size: ${tier.letter.length > 2 ? '24px' : '34px'};
            font-weight: 800;
            white-space: nowrap;
            line-height: 1.1;
        `;
        letterDiv.textContent = tier.letter;

        const labelTextDiv = document.createElement('div');
        labelTextDiv.style.cssText = `
            font-family: 'Inter', Arial, sans-serif;
            font-size: 9px;
            font-weight: 700;
            line-height: 13px;
            letter-spacing: 0.06em;
            max-width: 100%;
            overflow-wrap: anywhere;
            text-align: center;
            margin-top: 8px;
            opacity: 0.82;
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
            padding: 10px 14px;
            gap: 8px;
        `;

        coins.forEach(coinName => {
            const coinEl = document.createElement('div');
            coinEl.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 70px;
                padding: 4px 0;
            `;

            const logo = document.createElement('img');
            logo.style.cssText = `
                width: 52px;
                height: 52px;
                object-fit: contain;
                border-radius: 50%;
                background: ${EXPORT_LOGO_BG};
            `;
            logo.src = imageCache[coinName];
            logo.alt = coinName;
            coinEl.appendChild(logo);

            // No overflow clipping here: html2canvas cuts off glyphs inside
            // clipped boxes, so long tickers are shortened up front
            const text = document.createElement('div');
            text.style.cssText = `
                color: ${EXPORT_INK};
                font-family: 'Inter', Arial, sans-serif;
                font-weight: 700;
                font-size: 11px;
                line-height: 16px;
                letter-spacing: 0.04em;
                margin-top: 6px;
                white-space: nowrap;
            `;
            text.textContent = coinName.length > 8 ? `${coinName.slice(0, 7)}…` : coinName;

            coinEl.appendChild(text);
            content.appendChild(coinEl);
        });

        row.appendChild(label);
        row.appendChild(content);
        exportContainer.appendChild(row);
    });

    // Footer with the site address
    const footer = document.createElement('div');
    footer.style.cssText = `
        text-align: right;
        margin-top: 10px;
        padding-right: 2px;
    `;
    const footerText = document.createElement('span');
    footerText.style.cssText = `
        font-family: 'Inter', Arial, sans-serif;
        font-size: 12px;
        color: ${EXPORT_MUTED};
        letter-spacing: 0.04em;
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
        backgroundColor: '#11171d',
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
    setButtonLoading(exportBtn, 'Exporting…');

    try {
        const { canvas, exportContainer } = await createExportCanvas();
        document.body.removeChild(exportContainer);

        canvas.toBlob((blob) => {
            if (!blob) {
                showNotification('Export failed. Please try again.', 'error');
                resetButtonLoading(exportBtn, 'Export image');
                return;
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 10);
            link.download = `martinez-access-tier-list-${timestamp}.jpg`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);

            setButtonSuccess(exportBtn, 'Saved', 'Export image');
        }, 'image/jpeg', 0.95);

    } catch (error) {
        console.error('Export failed:', error);
        showNotification(`Export failed. ${error.message || 'Please try again.'}`, 'error');
        resetButtonLoading(exportBtn, 'Export image');
    }
}

// Local Storage - debounced wrapper
function saveToLocalStorage() {
    debouncedSave();
    updateTierCounts(); // Update counts immediately for responsive UI
}

// Keep the coin list in the order the tray shows it, so a reload or a shared
// link brings the tray back the same way
function syncCoinOrderFromDOM() {
    const poolOrder = Array.from(coinContainer.querySelectorAll('.coin'))
        .map(el => el.dataset.coin)
        .filter(symbol => coinSet.has(symbol));
    const inPool = new Set(poolOrder);
    coins = [...poolOrder, ...coins.filter(symbol => !inPool.has(symbol))];
}

// Actual save implementation
function actualSaveToLocalStorage() {
    syncCoinOrderFromDOM();
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
            updateTierLabels();
        }

        // Restore theme preference (applied by applyTheme in init)
        if (typeof state.isLightMode === 'boolean') {
            isLightMode = state.isLightMode;
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
    syncCoinOrderFromDOM();
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
        showNotification('Add the coins you hold first.', 'warning');
        return;
    }

    const encoded = encodeShareableData('s');
    if (!encoded) {
        showNotification('Could not create the submission link.', 'error');
        return;
    }

    const url = buildShareUrl(encoded);
    if (url.length > 2000) {
        showNotification('Too many coins to fit in a link. Try fewer coins.', 'warning');
        return;
    }

    setButtonLoading(submitBtn, 'Preparing…');

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

    setButtonSuccess(submitBtn, 'Opened X', 'Submit for review');
    showNotification(copied
        ? 'Post opened on X. The link is copied too, so you can DM it instead.'
        : 'Post opened on X with your submission link in it.');
}

// Copy shareable link to clipboard
async function copyShareableLink() {
    if (coins.length === 0) {
        showNotification('Add some coins first.', 'warning');
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
        showNotification('Could not create the link.', 'error');
        return;
    }

    const url = buildShareUrl(encoded);

    // Check URL length - most browsers support up to ~2000 chars
    if (url.length > 2000) {
        showNotification('Too many coins to fit in a link. Try fewer coins.', 'warning');
        return;
    }

    // Loading state on the button
    setButtonLoading(copyLinkBtn, 'Copying…');

    const copied = await copyTextWithFallback(url);
    if (copied) {
        setButtonSuccess(copyLinkBtn, 'Copied', 'Copy link');
        showNotification(mode === 's'
            ? 'Link copied. Nothing is ranked yet, so it opens as a portfolio to rank.'
            : 'Link to your tier list copied.');
    } else {
        // Last resort: show the URL in a dialog the user can copy manually
        resetButtonLoading(copyLinkBtn, 'Copy link');
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
    modal.className = 'confirm-modal share-fallback';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Copy link');

    const message = document.createElement('p');
    message.className = 'confirm-modal-message';
    message.textContent = 'Copy this link:';

    const input = document.createElement('input');
    input.type = 'text';
    input.readOnly = true;
    input.value = url;
    input.className = 'share-fallback-input';
    input.setAttribute('aria-label', 'Link to your tier list');

    const buttons = document.createElement('div');
    buttons.className = 'confirm-modal-buttons';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'confirm-modal-btn confirm';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(url);
            copyBtn.textContent = 'Copied';
            setTimeout(() => { overlay.classList.add('hiding'); setTimeout(() => overlay.remove(), 300); }, 600);
        } catch {
            input.select();
        }
    });

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'confirm-modal-btn cancel';
    closeBtn.textContent = 'Close';
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
        showNotification('That shared link is broken, so your own list is shown instead.', 'warning');
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

        // Load degen mode (applied by updateTierLabels below)
        if (typeof data.d === 'boolean') {
            isDegenMode = data.d;
        }

        // Load light mode (applied by applyTheme in init)
        if (typeof data.l === 'boolean') {
            isLightMode = data.l;
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
            ? 'Portfolio submission loaded. Rank the coins in Unranked.'
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

    // Confirmations clear quickly; problems stay a little longer
    setTimeout(() => {
        notification.classList.add('hiding');
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, type === 'success' ? 3200 : 5000);
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
    // Clear caches
    searchCache.clear();

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
