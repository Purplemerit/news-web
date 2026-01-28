import styles from './Article.module.css';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// This would normally come from a database or API
// For now, we'll get it from URL params and fetch from RSS if needed
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function ArticlePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const search = await searchParams;

  // Helper function to safely extract string from params
  const safeParam = (value: any, defaultValue: string = ''): string => {
    if (!value) return defaultValue;

    // If it's already a string, decode and return
    if (typeof value === 'string') {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }

    // If it's an object, try to extract string value
    if (typeof value === 'object') {
      // Handle XML parser objects with _ key
      if (value._ && typeof value._ === 'string') {
        return String(value._);
      }
      // Try to convert to string
      try {
        return String(value);
      } catch {
        return defaultValue;
      }
    }

    return defaultValue;
  };

  // Decode article data from URL params
  const title = safeParam(search.title);
  const image = safeParam(search.image);
  const content = safeParam(search.content);
  const date = safeParam(search.date);
  const category = safeParam(search.category, 'News');
  const source = safeParam(search.source);
  const sourceName = safeParam(search.sourceName, 'Original Source');

  if (!title) {
    notFound();
  }

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href="/">Home</Link> / <Link href={`/category/${category.toLowerCase()}`}>{category}</Link> / Article
      </div>

      <article className={styles.article}>
        <div className={styles.header}>
          <div className={styles.category}>{category}</div>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.meta}>
            <span className={styles.date}>{date}</span>
            <span className={styles.divider}>•</span>
            <span className={styles.source}>{sourceName}</span>
          </div>
        </div>

        {image && (
          <div className={styles.imageWrapper}>
            <img src={image} alt={title} className={styles.image} />
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.articleBody}>
            {content.split('\n').map((para, i) => (
              para.trim() && <p key={i} className={styles.paragraph}>{para.trim()}</p>
            ))}
          </div>

          {source && (
            <div className={styles.sourceLink}>
              <p>Read the full story on {sourceName}:</p>
              <a href={source} target="_blank" rel="noopener noreferrer" className={styles.externalLink}>
                View Original Article →
              </a>
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
  );
}
