import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';

export interface NewsArticleData {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  image?: string;
  source: string;
  category: string;
  country: string;
  publishedAt: string;
  url?: string;
  rephrasedAt: string;
}

/**
 * Store rephrased article in S3
 */
export async function storeArticleInS3(
  article: NewsArticleData,
  country: string,
  category: string
): Promise<string> {
  try {
    const key = `news/${country}/${category}/${article.id}.json`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(article, null, 2),
      ContentType: 'application/json',
      Metadata: {
        country,
        category,
        source: article.source,
      },
    });

    await s3Client.send(command);
    console.log(`✅ Stored article in S3: ${key}`);

    return key;
  } catch (error) {
    console.error('Error storing article in S3:', error);
    throw new Error('Failed to store article in S3');
  }
}

/**
 * Get article from S3
 */
export async function getArticleFromS3(
  country: string,
  category: string,
  articleId: string
): Promise<NewsArticleData | null> {
  try {
    const key = `news/${country}/${category}/${articleId}.json`;

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    const body = await response.Body?.transformToString();

    if (!body) return null;

    return JSON.parse(body) as NewsArticleData;
  } catch (error) {
    console.error(`Error getting article from S3: ${country}/${category}/${articleId}`, error);
    return null;
  }
}

/**
 * List all articles for a country and category from S3
 */
export async function listArticlesFromS3(
  country: string,
  category: string,
  limit: number = 50
): Promise<NewsArticleData[]> {
  try {
    const prefix = `news/${country}/${category}/`;

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: limit,
    });

    const response = await s3Client.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      return [];
    }

    // Fetch all articles
    const articles: NewsArticleData[] = [];

    for (const item of response.Contents) {
      if (!item.Key) continue;

      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: item.Key,
      });

      try {
        const articleResponse = await s3Client.send(getCommand);
        const body = await articleResponse.Body?.transformToString();

        if (body) {
          const article = JSON.parse(body) as NewsArticleData;
          articles.push(article);
        }
      } catch (error) {
        console.error(`Failed to fetch article: ${item.Key}`, error);
      }
    }

    // Sort by published date (newest first)
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return articles;
  } catch (error) {
    console.error(`Error listing articles from S3: ${country}/${category}`, error);
    return [];
  }
}

/**
 * Store multiple articles in batch
 */
export async function storeArticlesBatch(
  articles: NewsArticleData[],
  country: string,
  category: string
): Promise<string[]> {
  const keys: string[] = [];

  for (const article of articles) {
    try {
      const key = await storeArticleInS3(article, country, category);
      keys.push(key);
    } catch (error) {
      console.error(`Failed to store article: ${article.title}`, error);
    }
  }

  return keys;
}
