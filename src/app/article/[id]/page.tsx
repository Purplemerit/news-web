import styles from './Article.module.css';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { scrapeFullArticle } from '@/lib/scraper';
import SocialShare from '@/components/SocialShare';
import CopyButton from '@/components/CopyButton';
import ReadingProgress from '@/components/ReadingProgress';
import { Share2, Clock, BookOpen } from 'lucide-react';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export const dynamic = 'force-dynamic';

const safeParam = (value: any, defaultValue: string = ''): string => {
  if (!value) return defaultValue;
  if (Array.isArray(value)) value = value[0];
  if (typeof value === 'string') {
    try {
      // Only decode if it looks encoded (contains %)
      return value.includes('%') ? decodeURIComponent(value) : value;
    } catch { return value; }
  }
  return String(value || defaultValue);
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const search = await searchParams;
  const title = safeParam(search.title, 'News Article');
  const description = safeParam(search.content, '').substring(0, 160);
  const image = safeParam(search.image);

  return {
    title: `${title} | True Line News`,
    description,
    openGraph: {
      title,
      description,
      images: image ? [image] : [],
      type: 'article',
    },
  };
}

export default async function ArticlePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const search = await searchParams;

  const title = safeParam(search.title);
  const image = safeParam(search.image);
  const snippet = safeParam(search.content);
  const date = safeParam(search.date);
  const category = safeParam(search.category, 'News');
  const source = safeParam(search.source);
  const sourceName = safeParam(search.sourceName, 'Original Source');

  if (!title) {
    notFound();
  }

  // Construct current URL for sharing/copying
  // On Vercel, we can use headers to get the host if needed, 
  // but since it's a dynamic route we can just provide the path
  const currentPath = `/article/${id}?${new URLSearchParams(search as any).toString()}`;
  const baseUrl = process.env.NEXTAUTH_URL || '';
  const fullUrl = baseUrl ? `${baseUrl}${currentPath}` : currentPath;

  // Fetch full content if possible
  let fullContent = '';
  let isFullContent = false;
  let wordCount = snippet ? snippet.split(/\s+/).length : 0;

  if (source) {
    try {
      const scraped = await scrapeFullArticle(source);
      if (scraped && scraped.content) {
        fullContent = scraped.content;
        isFullContent = true;
        wordCount = scraped.textContent ? scraped.textContent.split(/\s+/).length : wordCount;
      }
    } catch (err) {
      console.error('Error in article scraping:', err);
    }
  }

  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <>
      <ReadingProgress />
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link> / <Link href={`/category/${category.toLowerCase()}`}>{category}</Link> / Article
        </div>

        <article className={styles.article}>
          <div className={styles.header}>
            <div className={styles.category}>{category}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
              <h1 className={styles.title}>{title}</h1>
              <div style={{ flexShrink: 0 }}>
                <CopyButton url={fullUrl} size={20} />
              </div>
            </div>

            <div className={styles.articleStats}>
              <div className={styles.statItem}>
                <Clock size={14} />
                <span>{readingTime} min read</span>
              </div>
              <div className={styles.statItem}>
                <BookOpen size={14} />
                <span>{wordCount} words</span>
              </div>
            </div>

            <div className={styles.meta}>
              <div className={styles.authorGroup}>
                <span className={styles.date}>{date}</span>
                <span className={styles.divider}>•</span>
                <span className={styles.source}>{sourceName}</span>
              </div>
              <div className={styles.shareIconGroup}>
                <Share2 size={16} />
                <SocialShare url={fullUrl} title={title} />
              </div>
            </div>
          </div>

          {image && !isFullContent && (
            <div className={styles.imageWrapper}>
              <img src={image} alt={title} className={styles.image} />
            </div>
          )}

          <div className={styles.content}>
            {isFullContent && (
              <div className={styles.fullStoryBadge}>Full Story Retrieved</div>
            )}
            {isFullContent ? (
              <div
                className={styles.articleBody}
                dangerouslySetInnerHTML={{ __html: fullContent }}
              />
            ) : (
              <div className={styles.articleBody}>
                {snippet.split('\n').map((para, i) => (
                  para.trim() && <p key={i} className={styles.paragraph}>{para.trim()}</p>
                ))}
              </div>
            )}

            <div className={styles.articleShareBottom}>
              <h3>Share this story</h3>
              <SocialShare url={fullUrl} title={title} />
            </div>

            {source && (
              <div className={styles.attribution}>
                <p>Original Source: <a href={source} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>{sourceName}</a></p>
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <Link href="/" className={styles.backButton}>
              ← Back to Homepage
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}
