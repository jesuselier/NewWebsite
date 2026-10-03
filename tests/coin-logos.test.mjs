import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  PREVIEW_COINS,
  getPreviewCoins,
  mergeMarketLogos,
  safeLogoUrl,
} from "../lib/coin-logos.ts";

const logo = (path) => `https://coin-images.coingecko.com/coins/images/${path}`;

test("accepts only HTTPS images from CoinGecko's image hosts", () => {
  assert.equal(safeLogoUrl(logo("1/large/bitcoin.png?1696501400")), logo("1/large/bitcoin.png?1696501400"));
  assert.equal(
    safeLogoUrl("https://assets.coingecko.com/coins/images/279/large/ethereum.png"),
    "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  );
  for (const bad of [
    "http://coin-images.coingecko.com/coins/images/1/large/bitcoin.png",
    "https://coin-images.coingecko.com.evil.example/coins/images/1/large/bitcoin.png",
    "https://evilcoingecko.com/coins/images/1/large/bitcoin.png",
    "https://www.coingecko.com/coins/images/1/large/bitcoin.png",
    "https://coin-images.coingecko.com/markets/images/1/large/bitcoin.png",
    "https://user:pass@coin-images.coingecko.com/coins/images/1/large/bitcoin.png",
    "https://coin-images.coingecko.com:8443/coins/images/1/large/bitcoin.png",
    "javascript:alert(1)",
    "not a url",
    "",
    null,
    42,
  ]) {
    assert.equal(safeLogoUrl(bad), null, String(bad));
  }
});

test("takes fresh logos by CoinGecko id without changing the coins or their order", () => {
  const rows = [
    { id: "dogecoin", image: logo("5/large/dogecoin.png?2") },
    { id: "bitcoin", image: logo("1/large/bitcoin.png?2") },
    { id: "bitcoin", image: logo("1/large/duplicate.png") },
    { id: "ethereum", image: "https://tracker.example/eth.png" },
    { id: "not-in-the-preview", image: logo("9/large/other.png") },
    null,
    "junk",
  ];
  const merged = mergeMarketLogos(PREVIEW_COINS, rows);
  assert.deepEqual(
    merged.map((coin) => coin.id),
    PREVIEW_COINS.map((coin) => coin.id),
  );
  assert.equal(merged[0].image, logo("1/large/bitcoin.png?2"));
  assert.equal(merged.at(-1).image, logo("5/large/dogecoin.png?2"));
  // Unsafe or missing logos keep the fallback
  assert.equal(merged[1].image, PREVIEW_COINS[1].image);
  assert.equal(merged[2].image, PREVIEW_COINS[2].image);
});

test("falls back to the bundled logos for error responses", () => {
  for (const response of [{ status: { error_code: 429 } }, null, "Too Many Requests", []]) {
    assert.deepEqual(mergeMarketLogos(PREVIEW_COINS, response), [...PREVIEW_COINS]);
  }
});

test("bundled fallbacks are valid and match the tool's Top 20 list", () => {
  const ids = new Set();
  for (const coin of PREVIEW_COINS) {
    assert.ok(safeLogoUrl(coin.image), coin.id);
    assert.match(coin.symbol, /^[A-Z0-9]{2,10}$/);
    assert.ok(!ids.has(coin.id), `duplicate ${coin.id}`);
    ids.add(coin.id);
  }
  const script = readFileSync(new URL("../public/tier-list-assets/script.js", import.meta.url), "utf8");
  const block = /'top-marketcap': \[([\s\S]*?)\n\s*\]/.exec(script)?.[1] ?? "";
  const top = [...block.matchAll(/symbol: '([^']+)', name: '([^']+)', id: '([^']+)', image: '([^']+)'/g)].map(
    ([, symbol, name, id, image]) => ({ id, symbol, name, image }),
  );
  assert.deepEqual(PREVIEW_COINS, top.slice(0, PREVIEW_COINS.length));
});

test("fetches CoinGecko once per call and survives failures", async (t) => {
  const realFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = realFetch;
  });

  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push([url, init]);
    return new Response(JSON.stringify([{ id: "solana", image: logo("4128/large/solana.png?3") }]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  const coins = await getPreviewCoins();
  assert.equal(calls.length, 1);
  const url = new URL(calls[0][0]);
  assert.equal(url.origin + url.pathname, "https://api.coingecko.com/api/v3/coins/markets");
  assert.equal(url.searchParams.get("ids"), PREVIEW_COINS.map((coin) => coin.id).join(","));
  assert.equal(calls[0][1].next.revalidate, 86400);
  assert.equal(coins.find((coin) => coin.id === "solana").image, logo("4128/large/solana.png?3"));

  globalThis.fetch = async () => new Response("rate limited", { status: 429 });
  assert.deepEqual(await getPreviewCoins(), [...PREVIEW_COINS]);

  globalThis.fetch = async () => {
    throw new TypeError("network down");
  };
  assert.deepEqual(await getPreviewCoins(), [...PREVIEW_COINS]);

  globalThis.fetch = async () => new Response("<html>oops</html>", { status: 200 });
  assert.deepEqual(await getPreviewCoins(), [...PREVIEW_COINS]);
});
