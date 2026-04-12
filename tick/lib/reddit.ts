import { SentimentSummary } from './types';
import { generateSentimentSummary } from './gemini';

export async function fetchRedditSentiment(symbol: string): Promise<SentimentSummary> {
  const url = `https://www.reddit.com/r/stocks+wallstreetbets/search.json?q=${encodeURIComponent(symbol)}&sort=new&limit=20&restrict_sr=1`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'tick-hackathon/0.1'
    }
  });

  if (!response.ok) {
    if (response.status === 429) {
      console.warn('Reddit rate limit hit');
      return { label: 'Mixed', points: ['Reddit data currently unavailable due to rate limits.'] };
    }
    throw new Error(`Reddit API error: ${response.status} ${await response.statusText}`);
  }

  const data = await response.json();
  const children = data?.data?.children || [];

  const posts = children.map((c: any) => ({
    title: c.data.title,
    selftext: c.data.selftext?.substring(0, 500), // truncate for manageable token size
    score: c.data.score,
    subreddit: c.data.subreddit,
  }));

  if (posts.length === 0) {
    return {
      label: 'Mixed',
      points: ['No recent Reddit discussions found for this ticker.']
    };
  }

  return generateSentimentSummary(posts);
}
