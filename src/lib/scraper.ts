import * as cheerio from 'cheerio';
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
const CACHE_DURATION = 60 * 60 * 1000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function extractWithGemini(html: string, url: string): Promise<Partial<ScrapedArticle> | null> {
    if (!process.env.GEMINI_API_KEY) return null;

    // Use a simpler fallback if Gemini is also being problematic
    const models = ['gemini-1.5-flash', 'gemini-2.0-flash-exp', 'gemini-pro'];

    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const $ = cheerio.load(html);
            $('script, style, nav, footer, header, ads, .ads, #ads').remove();
            const body = $('body').html()?.substring(0, 20000) || '';

            const prompt = `Extract the main article content from this HTML. Return only clean HTML paragraphs. URL: ${url}\nHTML: ${body}`;
            const result = await model.generateContent(prompt);
            return { content: result.response.text().replace(/```html|```/g, '').trim() };
        } catch (e) {
            console.warn(`Gemini extraction failed for ${modelName}, trying next...`);
        }
    }
    return null;
}

async function fetchWithTimeout(url: string, timeout = 9000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
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
    const cached = scraperCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) return cached.data;

    try {
        const response = await fetchWithTimeout(url);
        if (!response.ok) return null;

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove junk
        $('script, style, nav, footer, header, iframe, noscript, .ads, #ads').remove();

        // Smart Extraction: Find the largest block of text
        let mainContent = '';
        let largestTextLen = 0;

        // Common article containers
        const containers = ['article', '.article-body', '.content', '.post-content', '.entry-content', 'main', '#main-content'];

        for (const selector of containers) {
            const el = $(selector);
            if (el.length > 0) {
                const text = el.text().trim();
                if (text.length > largestTextLen) {
                    largestTextLen = text.length;
                    mainContent = el.html() || '';
                }
            }
        }

        // Fallback: Use body if no container found
        if (largestTextLen < 500) {
            mainContent = $('body').html() || '';
        }

        const textContent = cheerio.load(mainContent).text().trim().replace(/\s+/g, ' ');

        const result: ScrapedArticle = {
            title: $('title').text() || '',
            content: mainContent,
            textContent: textContent,
            excerpt: '',
            byline: '',
            siteName: url.split('/')[2],
        };

        if (result.content.length > 500) {
            scraperCache.set(url, { data: result, timestamp: Date.now() });
        }

        return result;
    } catch (error: any) {
        console.error(`Scraper error for ${url}:`, error.message);
        return null;
    }
}
