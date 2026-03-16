/* @meta
{
  "name": "polymarket/market",
  "description": "Get detailed information about a specific Polymarket",
  "domain": "polymarket.com",
  "args": {
    "slug": {"required": true, "description": "Market slug or ID"}
  },
  "readOnly": true,
  "example": "bb-browser site polymarket/market \"will-trump-win-2024-election\""
}
*/
async function(args) {
  if (!args.slug) {
    return {error: 'Missing required argument: slug'};
  }
  const resp = await fetch(`https://gamma-api.polymarket.com/markets?slug=${encodeURIComponent(args.slug)}`, {
    credentials: 'include'
  });
  if (!resp.ok) {
    return {error: `HTTP ${resp.status}`, hint: 'Failed to fetch market details'};
  }
  const markets = await resp.json();
  if (!markets || markets.length === 0) {
    return {error: 'Market not found'};
  }
  const m = markets[0];
  let yesPrice = null;
  let noPrice = null;
  if (m.outcomePrices) {
    try {
      const prices = JSON.parse(m.outcomePrices);
      yesPrice = parseFloat(prices[0]).toFixed(2);
      noPrice = parseFloat(prices[1]).toFixed(2);
    } catch (e) {}
  }
  return {
    question: m.question,
    description: m.description,
    slug: m.slug,
    volume: parseFloat(m.volume).toFixed(2),
    liquidity: parseFloat(m.liquidity).toFixed(2),
    yes_price: yesPrice,
    no_price: noPrice,
    last_trade_price: m.lastTradePrice ? parseFloat(m.lastTradePrice).toFixed(2) : null,
    best_bid: m.bestBid ? parseFloat(m.bestBid).toFixed(2) : null,
    best_ask: m.bestAsk ? parseFloat(m.bestAsk).toFixed(2) : null,
    endDate: m.endDate,
    closed: m.closed,
    active: !m.closed,
    createdBy: m.createdBy,
    category: m.category,
    outcomes: m.outcomes
  };
}
