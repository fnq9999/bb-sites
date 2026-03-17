/* @meta
{
  "name": "zhihu/recommend",
  "description": "Get Zhihu recommended feed (推荐内容)",
  "domain": "www.zhihu.com",
  "args": {
    "limit": {"required": false, "description": "Number of posts to fetch (default: 10)"}
  },
  "readOnly": true,
  "example": "bb-browser site zhihu/recommend 20"
}
*/
async function(args) {
  const limit = args.limit || 10;
  const resp = await fetch(`/api/v3/feed/topstory/recommend?limit=${limit}&desktop=true`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });

  if (!resp.ok) {
    return {error: `HTTP ${resp.status}`, hint: 'Not logged in or rate limited?'};
  }

  const data = await resp.json();

  // Clean up and format the response
  const posts = (data.data || []).map(item => {
    const target = item.target;
    if (!target) return null;

    let type = target.type;
    let title = target.title || '';
    let content = target.excerpt || target.content || '';
    let author = target.author ? target.author.name : 'Unknown';
    let voteCount = target.voteup_count || 0;
    let commentCount = target.comment_count || 0;
    let url = target.url ? `https://www.zhihu.com${target.url}` : '';

    return {
      type,
      title,
      content: content.slice(0, 500) + (content.length > 500 ? '...' : ''),
      author,
      voteCount,
      commentCount,
      url,
      createdTime: target.created_time ? new Date(target.created_time * 1000).toISOString() : null
    };
  }).filter(Boolean);

  return {
    posts,
    paging: data.paging,
    total: posts.length
  };
}
