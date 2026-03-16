/* @meta
{
  "name": "polymarket/trending",
  "description": "Get trending events and markets on Polymarket (uses events API)",
  "domain": "polymarket.com",
  "args": {
    "limit": {"required": false, "description": "Number of events to return (default: 10)", "default": 10},
    "sort": {"required": false, "description": "Sort field: volume (交易量), startDate, endDate (default: volume, 交易量从高到低)", "default": "volume"},
    "closed": {"required": false, "description": "Set to true to include closed/ended events (default: false, only show active events)", "default": false},
    "category": {"required": false, "description": "Filter by category: Sports, Politics, Crypto, Business, etc."}
  },
  "readOnly": true,
  "example": "bb-browser site polymarket/trending 20"
}
*/
async function(args) {
  const limit = args.limit || 10;
  const sort = args.sort || 'volume';
  const category = args.category || '';
  const closed = args.closed !== undefined ? String(args.closed).toLowerCase() === 'true' : false;

  let url = `https://gamma-api.polymarket.com/events?limit=${limit}&sort=${sort}`;
  if (!closed) {
    url += '&closed=false'; // 默认只返回活跃未结束的事件
  }
  if (category) {
    url += `&category=${encodeURIComponent(category)}`;
  }

  const resp = await fetch(url, {
    credentials: 'include'
  });
  if (!resp.ok) {
    return {error: `HTTP ${resp.status}`, hint: 'Failed to fetch trending events'};
  }
  const events = await resp.json();
  // 强制按交易量从大到小排序
  const sortedEvents = events.sort((a, b) => {
    const volA = parseFloat(a.volume || 0);
    const volB = parseFloat(b.volume || 0);
    return volB - volA;
  });

  return {
    trending_events: sortedEvents.map(e => {
      // 提取事件下的市场信息
      const markets = (e.markets || []).map(m => {
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
          volume: parseFloat(m.volume || 0).toFixed(2),
          yes_price: yesPrice,
          no_price: noPrice,
          last_trade_price: m.lastTradePrice ? parseFloat(m.lastTradePrice).toFixed(2) : null,
          best_bid: m.bestBid ? parseFloat(m.bestBid).toFixed(2) : null,
          best_ask: m.bestAsk ? parseFloat(m.bestAsk).toFixed(2) : null,
          endDate: m.endDate,
          closed: m.closed,
          active: !m.closed
        };
      });

      return {
        event_id: e.id,
        title: e.title,
        ticker: e.ticker,
        category: e.category || 'Uncategorized',
        total_volume: parseFloat(e.volume || 0).toFixed(2),
        market_count: markets.length,
        start_date: e.startDate,
        end_date: e.endDate,
        markets: markets
      };
    })
  };
}
