import { NewsArticle } from '@/types/rss';

/**
 * Safely convert any value to string
 */
function safeText(text: any): string {
  if (!text) return '';
  if (typeof text === 'string') return text;

  // Handle XML parser objects with _ key
  if (typeof text === 'object' && text._) {
    return String(text._);
  }

  // Try to convert to string
  try {
    return String(text);
  } catch (e) {
    return '';
  }
}

/**
 * Generate a URL-safe slug from article title
 */
export function generateSlug(title: string): string {
  const safeTitle = safeText(title);
  return safeTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 100);
}

/**
 * Generate internal article URL with all necessary data in query params
 */
export function getArticleUrl(article: NewsArticle): string {
  const slug = generateSlug(article.title);
  const params = new URLSearchParams({
    title: safeText(article.title),
    image: safeText(article.image) || '',
    content: safeText(article.description),
    date: safeText(article.pubDate),
    category: safeText(article.category) || 'News',
    source: safeText(article.link),
    sourceName: safeText(article.sourceName) || 'News Source',
  });

  return `/article/${slug}?${params.toString()}`;
}
