import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ScrapedArticle {
    title: string;
    content: string;
    textContent: string;
    excerpt: string;
    byline: string;
    siteName: string;
}

const scraperCache = new Map<string, { data: ScrapedArticle; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour for full articles

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Clean HTML to reduce token usage for Gemini
 */
async function cleanHtmlForGemini(html: string): Promise<string> {
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Remove scripts, styles, nav, footer, ads
    const toRemove = doc.querySelectorAll('script, style, nav, footer, iframe, noscript, .ads, #ads, header');
    toRemove.forEach(el => el.remove());

    return doc.body.innerHTML;
}

async function extractWithGemini(html: string, url: string): Promise<Partial<ScrapedArticle> | null> {
    if (!process.env.GEMINI_API_KEY) return null;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const cleanContent = await cleanHtmlForGemini(html);

        const prompt = `
            Extract the full main article content from this HTML snippet. 
            Return the content as clean HTML (only paragraphs, headings, and lists). 
            Do not include ads, navigation links, or sidebars.
            URL: ${url}
            HTML: ${cleanContent.substring(0, 30000)} // Truncate to avoid token limits
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Basic cleaning of Gemini output (remove markdown code blocks if any)
        const content = text.replace(/```html|```/g, '').trim();

        return { content };
    } catch (error) {
        console.error('Gemini extraction error:', error);
        return null;
    }
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, options: any = {}, timeout = 8000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

export async function scrapeFullArticle(url: string): Promise<ScrapedArticle | null> {
    // Check cache
    const cached = scraperCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }

    try {
        const response = await fetchWithTimeout(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
        }, 8000); // 8 second timeout

        if (!response.ok) {
            throw new Error(`Failed to fetch article: ${response.statusText}`);
        }

        const html = await response.text();

        // Dynamic imports to prevent issues on some platforms
        const { JSDOM } = await import('jsdom');
        const { Readability } = await import('@mozilla/readability');

        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        let result: ScrapedArticle;

        if (!article || !article.content || article.content.length < 500) {
            // If readability fails or content is too short, try Gemini
            const geminiResult = await extractWithGemini(html, url);

            result = {
                title: article?.title || dom.window.document.title || '',
                content: geminiResult?.content || article?.content || '',
                textContent: article?.textContent || '',
                excerpt: article?.excerpt || '',
                byline: article?.byline || '',
                siteName: article?.siteName || '',
            };
        } else {
            result = {
                title: article.title || '',
                content: article.content || '',
                textContent: article.textContent || '',
                excerpt: article.excerpt || '',
                byline: article.byline || '',
                siteName: article.siteName || '',
            };
        }

        // Cache the result
        scraperCache.set(url, {
            data: result,
            timestamp: Date.now(),
        });

        return result;
    } catch (error) {
        console.error(`Error scraping article at ${url}:`, error);
        return null;
    }
}
