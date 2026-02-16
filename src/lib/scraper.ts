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
 * Fetch with timeout and better headers
 */
async function fetchWithTimeout(url: string, options: any = {}, timeout = 9000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        ...options.headers,
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers,
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
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION && cached.data.content.length > 500) {
        return cached.data;
    }

    try {
        const response = await fetchWithTimeout(url, {}, 9000);

        if (!response.ok) {
            console.error(`Failed to fetch article: ${response.status} ${response.statusText} for ${url}`);
            return null;
        }

        const html = await response.text();
        if (html.length < 1000) {
            console.warn(`HTML content too short (${html.length} chars) for ${url}. Might be a block page.`);
        }

        // Dynamic imports for production stability
        const jsdomModule = await import('jsdom');
        const JSDOM = jsdomModule.JSDOM;

        const readabilityModule = await import('@mozilla/readability');
        const Readability = readabilityModule.Readability;

        const dom = new JSDOM(html, { url, resources: "usable" });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        let result: ScrapedArticle;

        const hasValidReadability = article && article.content && article.content.length > 600;

        if (!hasValidReadability) {
            console.log(`Readability failed or content too short for ${url}, trying Gemini fallback...`);
            const geminiResult = await extractWithGemini(html, url);

            result = {
                title: article?.title || dom.window.document.title || 'Untitled Article',
                content: geminiResult?.content || article?.content || '',
                textContent: article?.textContent || (geminiResult?.content ? geminiResult.content.replace(/<[^>]*>/g, '') : ''),
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

        // Only cache if we actually got significant content
        if (result.content.length > 500) {
            scraperCache.set(url, {
                data: result,
                timestamp: Date.now(),
            });
        }

        return result;
    } catch (error: any) {
        console.error(`Error scraping article at ${url}:`, error.message);
        return null;
    }
}
