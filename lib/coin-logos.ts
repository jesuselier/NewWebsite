export type PreviewCoin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
};

/**
 * The homepage tier-list preview shows these coins waiting in Unranked, with
 * no ranking implied. They are the first coins of the tool's "Top 20" category,
 * in the same order. Logos come from CoinGecko's free API; these URLs are the
 * fallback when it cannot be reached.
 */
export const PREVIEW_COINS: readonly PreviewCoin[] = [
  {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    image: "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png",
  },
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    image: "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png",
  },
  {
    id: "ripple",
    symbol: "XRP",
    name: "XRP",
    image:
      "https://coin-images.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
  },
  {
    id: "solana",
    symbol: "SOL",
    name: "Solana",
    image: "https://coin-images.coingecko.com/coins/images/4128/large/solana.png",
  },
  {
    id: "binancecoin",
    symbol: "BNB",
    name: "BNB",
    image: "https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
  },
  {
    id: "dogecoin",
    symbol: "DOGE",
    name: "Dogecoin",
    image: "https://coin-images.coingecko.com/coins/images/5/large/dogecoin.png",
  },
];

const LOGO_HOSTS = new Set(["assets.coingecko.com", "coin-images.coingecko.com"]);

/** Accept only HTTPS coin images from CoinGecko's own image hosts. */
export function safeLogoUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      !LOGO_HOSTS.has(url.hostname) ||
      !url.pathname.startsWith("/coins/images/")
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}

/**
 * Take the logo for each preview coin from a CoinGecko /coins/markets
 * response, matched by id. The coin list and its order never change, and any
 * coin without a usable logo in the response keeps its fallback.
 */
export function mergeMarketLogos(
  coins: readonly PreviewCoin[],
  rows: unknown,
): PreviewCoin[] {
  const logos = new Map<string, string>();
  if (Array.isArray(rows)) {
    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      const { id, image } = row as { id?: unknown; image?: unknown };
      const logo = safeLogoUrl(image);
      if (typeof id === "string" && logo && !logos.has(id)) logos.set(id, logo);
    }
  }
  return coins.map((coin) => ({ ...coin, image: logos.get(coin.id) ?? coin.image }));
}

/** Current logos from CoinGecko's free API, refreshed daily, with fallbacks. */
export async function getPreviewCoins(): Promise<PreviewCoin[]> {
  const ids = PREVIEW_COINS.map((coin) => coin.id).join(",");
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&per_page=${PREVIEW_COINS.length}&page=1`,
      {
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(5000),
        headers: { Accept: "application/json" },
      },
    );
    if (!response.ok) return [...PREVIEW_COINS];
    return mergeMarketLogos(PREVIEW_COINS, await response.json());
  } catch {
    return [...PREVIEW_COINS];
  }
}
