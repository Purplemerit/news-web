import Parser from 'rss-parser';
import { RSSFeed, RSSFeedItem, NewsArticle, FeedCategory } from '@/types/rss';
import { RSS_FEEDS, CACHE_DURATION } from '@/config/rssFeeds';
import { CountryCode, getFeedUrlsForCountry } from '@/config/multiTenantFeeds';
import { prisma } from '@/lib/prisma';

interface CacheEntry {
  data: RSSFeed;
  timestamp: number;
}

// In-memory cache
const cache = new Map<FeedCategory, CacheEntry>();

// Create parser instance
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media:content', { keepArray: true }],
      ['media:thumbnail', 'media:thumbnail'],
      ['enclosure', 'enclosure'],
      ['content:encoded', 'content:encoded'],
    ],
  },
});

/**
 * Extract image URL from RSS feed item
 */
function extractImageUrl(item: any): string | undefined {
  // Try The Hindu's media:content format first
  if (item['media:content']?.$?.url) {
    return item['media:content'].$.url;
  }

  // Try media:content as array
  if (Array.isArray(item['media:content']) && item['media:content'][0]?.$?.url) {
    return item['media:content'][0].$.url;
  }

  // Try enclosure
  if (item.enclosure?.url) {
    return item.enclosure.url;
  }

  // Try media:thumbnail
  if (item['media:thumbnail']?.$?.url) {
    return item['media:thumbnail'].$.url;
  }

  // Try content:encoded for images
  if (item['content:encoded']) {
    const imgMatch = item['content:encoded'].match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1];
    }
  }

  // Try to extract image from description HTML
  if (item.description) {
    const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1];
    }
  }

  // Try content for images
  if (item.content) {
    const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1];
    }
  }

  // Return undefined if no image found (will use fallback in components)
  return undefined;
}

/**
 * Extract plain text from HTML description
 */
function extractPlainText(html: string): string {
  if (!html) return '';

  // Remove HTML tags
  const text = html.replace(/<[^>]*>/g, ' ');

  // Decode HTML entities
  const decoded = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean up extra whitespace
  return decoded.replace(/\s+/g, ' ').trim();
}

/**
 * Calculate estimated reading time
 */
function calculateReadTime(text: string): string {
  const wordsPerMinute = 200;
  const words = text.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} Min`;
}

/**
 * Format date to readable string
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      return date.toLocaleDateString('en-US', options);
    }
  } catch (error) {
    return dateString;
  }
}

/**
 * Fetch RSS feed with caching
 */
export async function fetchRSSFeed(category: FeedCategory): Promise<RSSFeed> {
  // Check cache
  const cached = cache.get(category);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const feedUrl = RSS_FEEDS[category];
    const feed = await parser.parseURL(feedUrl);

    const rssFeed: RSSFeed = {
      items: feed.items.map((item: any) => {
        // Extract image URL from the item
        const imageUrl = extractImageUrl(item);

        return {
          title: item.title || '',
          link: item.link || '',
          pubDate: item.pubDate || '',
          description: item.description || '',
          content: item.content || '',
          contentSnippet: item.contentSnippet || '',
          guid: item.guid || item.link,
          categories: item.categories || [],
          isoDate: item.isoDate || '',
          enclosure: imageUrl ? { url: imageUrl } : item.enclosure,
        };
      }),
      title: feed.title,
      description: feed.description,
      link: feed.link,
    };

    // Update cache
    cache.set(category, {
      data: rssFeed,
      timestamp: Date.now(),
    });

    return rssFeed;
  } catch (error) {
    console.error(`Error fetching RSS feed for ${category}:`, error);

    // Return cached data if available, even if expired
    if (cached) {
      return cached.data;
    }

    // Return empty feed as fallback
    return {
      items: [],
      title: category,
      description: '',
      link: '',
    };
  }
}

/**
 * Convert RSS feed items to NewsArticle format
 */
export function convertToNewsArticles(items: RSSFeedItem[], sourceName?: string): NewsArticle[] {
  return items.map((item) => {
    const plainText = extractPlainText(item.description || item.contentSnippet || '');

    return {
      title: item.title,
      link: item.link,
      pubDate: formatDate(item.pubDate || item.isoDate || ''),
      description: plainText,
      image: extractImageUrl(item),
      category: item.categories?.[0] || 'News',
      readTime: calculateReadTime(plainText),
      sourceName: sourceName,
    };
  });
}

/**
 * Fetch multiple feeds at once
 */
export async function fetchMultipleFeeds(categories: FeedCategory[]): Promise<Record<FeedCategory, RSSFeed>> {
  const feeds = await Promise.all(
    categories.map(async (category) => ({
      category,
      feed: await fetchRSSFeed(category),
    }))
  );

  return feeds.reduce((acc, { category, feed }) => {
    acc[category] = feed;
    return acc;
  }, {} as Record<FeedCategory, RSSFeed>);
}

const urlCache = new Map<string, { data: RSSFeed; timestamp: number }>();

/**
 * Fetch RSS feed from a specific URL (for multi-tenant feeds)
 */
export async function fetchRSSFromUrl(url: string): Promise<RSSFeed> {
  // Check cache
  const cached = urlCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const feed = await parser.parseURL(url);

    const rssFeed: RSSFeed = {
      items: feed.items.map((item: any) => {
        const imageUrl = extractImageUrl(item);

        return {
          title: item.title || '',
          link: item.link || '',
          pubDate: item.pubDate || '',
          description: item.description || '',
          content: item.content || '',
          contentSnippet: item.contentSnippet || '',
          guid: item.guid || item.link,
          categories: item.categories || [],
          isoDate: item.isoDate || '',
          enclosure: imageUrl ? { url: imageUrl } : item.enclosure,
        };
      }),
      title: feed.title,
      description: feed.description,
      link: feed.link,
    };

    // Update cache
    urlCache.set(url, {
      data: rssFeed,
      timestamp: Date.now(),
    });

    return rssFeed;
  } catch (error) {
    console.error(`Error fetching RSS feed from ${url}:`, error);

    // Return cached data if available, even if expired
    if (cached) {
      return cached.data;
    }

    return {
      items: [],
      title: 'News',
      description: '',
      link: '',
    };
  }
}

/**
 * Fetch country-specific feeds for a category
 */
export async function fetchCountryFeeds(
  countryCode: CountryCode,
  category: 'homepage' | 'news' | 'world' | 'business' | 'sports' | 'technology' | 'entertainment' | 'politics'
): Promise<NewsArticle[]> {
  let feedUrls: string[] = [];

  try {
    // Try to get feeds from the database first
    const dbSources = await prisma.newsSource.findMany({
      where: {
        country: countryCode,
        category: category,
        active: true
      }
    });

    if (dbSources.length > 0) {
      feedUrls = dbSources.map((s: any) => s.url);
    } else {
      // Fallback to static config
      feedUrls = getFeedUrlsForCountry(countryCode, category);
    }
  } catch (err) {
    console.error('Error fetching feeds from DB, falling back to static:', err);
    feedUrls = getFeedUrlsForCountry(countryCode, category);
  }

  if (feedUrls.length === 0) {
    console.log(`No feeds found for ${countryCode} - ${category}`);
    return [];
  }

  // Fetch all feeds for this country and category
  const allFeeds = await Promise.all(
    feedUrls.map(url => fetchRSSFromUrl(url))
  );

  // Combine all items from all sources
  const allItems: RSSFeedItem[] = allFeeds.flatMap(feed => feed.items);

  // Sort by date (most recent first)
  allItems.sort((a, b) => {
    const dateA = new Date(a.isoDate || a.pubDate || 0);
    const dateB = new Date(b.isoDate || b.pubDate || 0);
    return dateB.getTime() - dateA.getTime();
  });

  // Convert to NewsArticle format
  return convertToNewsArticles(allItems, allFeeds[0]?.title);
}

/**
 * Fetch multiple country-specific categories at once
 */
export async function fetchMultipleCountryFeeds(
  countryCode: CountryCode,
  categories: Array<'homepage' | 'news' | 'world' | 'business' | 'sports' | 'technology' | 'entertainment' | 'politics'>
): Promise<Record<string, NewsArticle[]>> {
  const feeds = await Promise.all(
    categories.map(async (category) => ({
      category,
      articles: await fetchCountryFeeds(countryCode, category),
    }))
  );

  return feeds.reduce((acc, { category, articles }) => {
    acc[category] = articles;
    return acc;
  }, {} as Record<string, NewsArticle[]>);
}
