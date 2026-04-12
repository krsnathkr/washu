import { NewsItem } from './types';

export async function getRecentNews(symbol: string): Promise<NewsItem[]> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) {
    console.warn('NEWSAPI_KEY is not defined, returning empty news list.');
    return [];
  }

  // Use symbol AND "stock" or "financial" to reduce noise
  const query = encodeURIComponent(`${symbol} stock`);
  const url = `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&language=en&pageSize=5&apiKey=${apiKey}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    console.error('NewsAPI fetch error:', response.status, await response.text());
    return [];
  }

  const data = await response.json();
  const articles: any[] = data.articles || [];

  return articles.slice(0, 5).map(a => ({
    title: a.title || 'Untitled',
    source: a.source?.name || 'Unknown Origin',
    url: a.url || '#',
    publishedAt: a.publishedAt || new Date().toISOString(),
    imageUrl: a.urlToImage || undefined
  }));
}
