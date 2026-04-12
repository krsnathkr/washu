import { SentimentSummary } from './types';
import {
  generateIndexedRedditSentimentSummary,
  generateSentimentSummary,
} from './gemini';

function buildUnavailableSentiment(message: string): SentimentSummary {
  return {
    label: 'Mixed',
    points: [
      message,
      'Live Reddit results could not be fetched from the deployed environment.',
      'Try again later if you want a fresh direct Reddit read.',
    ],
  };
}

export async function fetchRedditSentiment(symbol: string): Promise<SentimentSummary> {
  const url = `https://www.reddit.com/r/stocks+wallstreetbets/search.json?q=${encodeURIComponent(symbol)}&sort=new&limit=20&restrict_sr=1`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'tick-hackathon/0.1'
    }
  });

  if (!response.ok) {
    if (response.status === 403 || response.status === 429) {
      console.warn(`Reddit returned ${response.status} for ${symbol}; falling back to indexed web search`);

      try {
        return await generateIndexedRedditSentimentSummary(symbol);
      } catch (fallbackError) {
        console.warn('Indexed Reddit sentiment fallback failed', fallbackError);

        return buildUnavailableSentiment(
          response.status === 403
            ? 'Reddit blocked the live request, so this is temporarily unavailable.'
            : 'Reddit rate-limited the live request, so this is temporarily unavailable.'
        );
      }
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
