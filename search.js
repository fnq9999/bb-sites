/* @meta
{
  "name": "polymarket/search",
  "description": "Search markets, events, and profiles on Polymarket by keyword",
  "domain": "polymarket.com",
  "args": {
    "query": {"required": true, "description": "Search keyword"},
    "limit": {"required": false, "description": "Number of results (default: 10)", "default": 10},
    "closed": {"required": false, "description": "Set to true to include closed/ended markets (default: false, only show active markets)", "default": false}
  },
  "readOnly": true,
  "example": "bb-browser site polymarket/search \"Bitcoin price\" 15 markets"
}
*/
async function(args) {
  if (!args.query) {
    return {error: 'Missing required argument: query'};
  }
  const limit = args.limit || 10;
  const closed = args.closed !== undefined ? String(args.closed).toLowerCase() === 'true' : false;
  const closedFilter = closed ? '' : '&closed=false'; // 默认只返回活跃市场
  const resp = await fetch(`https://gamma-api.polymarket.com/markets?q=${encodeURIComponent(args.query)}&limit=${limit * 2}${closedFilter}&sort=-volumeNum&locale=zh`, {
    credentials: 'include'
  });
  if (!resp.ok) {
    return {error: `HTTP ${resp.status}`, hint: 'Search failed'};
  }
  const markets = await resp.json();
  // 搜索结果按交易量从大到小排序
  const sortedMarkets = markets.sort((a, b) => {
    const volA = parseFloat(a.volume || a.volumeNum || 0);
    const volB = parseFloat(b.volume || b.volumeNum || 0);
    return volB - volA;
  });

  return {
    query: args.query,
    results: sortedMarkets.slice(0, limit).map(m => {
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
        slug: m.slug,
        volume: parseFloat(m.volume || m.volumeNum || 0).toFixed(2),
        yes_price: yesPrice,
        no_price: noPrice,
        last_trade_price: m.lastTradePrice ? parseFloat(m.lastTradePrice).toFixed(2) : null,
        best_bid: m.bestBid ? parseFloat(m.bestBid).toFixed(2) : null,
        best_ask: m.bestAsk ? parseFloat(m.bestAsk).toFixed(2) : null,
        closed: m.closed,
        active: !m.closed,
        endDate: m.endDate,
        category: m.category
      };
    })
  };
}
