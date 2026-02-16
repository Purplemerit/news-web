import styles from './Article.module.css';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { scrapeFullArticle } from '@/lib/scraper';
import { expandNewsSnippet } from '@/lib/geminiService';
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

function decodeParam(val: any, fallback = ''): string {
  if (!val) return fallback;
  const str = Array.isArray(val) ? String(val[0]) : String(val);
  try {
    return str.includes('%') ? decodeURIComponent(str) : str;
  } catch {
    return str;
  }
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const search = await searchParams;
  const title = decodeParam(search.title, 'News Article');
  const description = decodeParam(search.content || search.snippet, '').substring(0, 160);
  const image = decodeParam(search.image);

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

  // Robust parameter extraction
  const title = decodeParam(search.title);
  const image = decodeParam(search.image);
  const snippet = decodeParam(search.content || search.snippet);
  const date = decodeParam(search.date);
  const category = decodeParam(search.category, 'News');
  const source = decodeParam(search.source);
  const sourceName = decodeParam(search.sourceName, 'Original Source');

  if (!title) {
    notFound();
  }

  // Build clean sharing URL
  const shareParams = new URLSearchParams();
  if (title) shareParams.set('title', title);
  if (image) shareParams.set('image', image);
  if (snippet) shareParams.set('content', snippet);
  if (date) shareParams.set('date', date);
  if (category) shareParams.set('category', category);
  if (source) shareParams.set('source', source);
  if (sourceName) shareParams.set('sourceName', sourceName);

  const currentPath = `/article/${id}?${shareParams.toString()}`;
  const baseUrl = process.env.NEXTAUTH_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const fullUrl = baseUrl ? `${baseUrl}${currentPath}` : currentPath;

  let fullContent = '';
  let isFullContent = false;
  let isAiEnhanced = false;
  let wordCount = snippet ? snippet.split(/\s+/).length : 0;

  if (source) {
    try {
      const scraped = await scrapeFullArticle(source);
      if (scraped && scraped.content && scraped.content.length > 800) {
        fullContent = scraped.content;
        isFullContent = true;
        wordCount = scraped.textContent ? scraped.textContent.split(/\s+/).length : wordCount;
      } else {
        const expanded = await expandNewsSnippet(title, snippet, category);
        fullContent = expanded;
        isFullContent = true;
        isAiEnhanced = expanded.length > (snippet?.length || 0) + 200;
        wordCount = fullContent.replace(/<[^>]*>/g, '').split(/\s+/).length;
      }
    } catch (err) {
      console.error('Scraping error, falling back to AI:', err);
      const expanded = await expandNewsSnippet(title, snippet, category);
      fullContent = expanded;
      isFullContent = true;
      isAiEnhanced = expanded.length > (snippet?.length || 0) + 200;
      wordCount = fullContent.replace(/<[^>]*>/g, '').split(/\s+/).length;
    }
  } else if (snippet) {
    const expanded = await expandNewsSnippet(title, snippet, category);
    fullContent = expanded;
    isFullContent = true;
    isAiEnhanced = expanded.length > (snippet?.length || 0) + 200;
    wordCount = fullContent.replace(/<[^>]*>/g, '').split(/\s+/).length;
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
              <h1 className={styles.title}>{title}</h1>
              <div style={{ flexShrink: 0, marginTop: '8px' }}>
                <CopyButton url={fullUrl} size={20} />
              </div>
            </div>

            <div className={styles.articleStats}>
              <div className={styles.statItem}>
                <Clock size={16} />
                <span>{readingTime} min read</span>
              </div>
              <div className={styles.statItem}>
                <BookOpen size={16} />
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
                <SocialShare url={fullUrl} title={title} />
              </div>
            </div>
          </div>

          {!isAiEnhanced && image && (
            <div className={styles.imageWrapper}>
              <img src={image} alt={title} className={styles.image} />
            </div>
          )}

          <div className={styles.content}>
            {isAiEnhanced ? (
              <div className={styles.fullStoryBadge} style={{ background: '#f0f9ff', color: '#0369a1', borderColor: '#bae6fd' }}>
                AI Enhanced Report
              </div>
            ) : isFullContent ? (
              <div className={styles.fullStoryBadge}>Full Story Retrieved</div>
            ) : null}

            {isFullContent ? (
              <div
                className={styles.articleBody}
                dangerouslySetInnerHTML={{ __html: fullContent }}
              />
            ) : (
              <div className={styles.articleBody}>
                {snippet ? snippet.split('\n').map((para, i) => (
                  para.trim() && <p key={i} className={styles.paragraph}>{para.trim()}</p>
                )) : <p>Article content unavailable.</p>}
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
