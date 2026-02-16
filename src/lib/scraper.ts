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
        console.log(`🔍 Scraping for: ${url}`);
        const response = await fetchWithTimeout(url);
        if (!response.ok) return null;

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove extreme junk
        $('script, style, nav, footer, header, iframe, noscript, .ads, #ads, aside').remove();

        // SMART EXTRACTION: Find the container with the most text
        let bestContent = '';
        let maxTextLength = 0;

        // Try standard containers first
        const selectors = ['article', '.article-content', '.post-content', '.entry-content', 'main', '#main-content', '.content', '.story-content', '.article__body-text'];
        selectors.forEach(selector => {
            const el = $(selector);
            if (el.length > 0) {
                const text = el.text().trim();
                if (text.length > maxTextLength) {
                    maxTextLength = text.length;
                    bestContent = el.html() || '';
                }
            }
        });

        // Fallback: search for any div with significant text, but score by density
        if (maxTextLength < 800) {
            $('div, section').each((_, el) => {
                const $el = $(el);
                if ($el.is('nav, footer, header, aside')) return;

                const text = $el.text().trim();
                const linkText = $el.find('a').text().trim();
                const density = text.length > 0 ? (text.length - linkText.length) / text.length : 0;

                if (text.length > maxTextLength && text.length < 30000 && density > 0.5) {
                    maxTextLength = text.length;
                    bestContent = $el.html() || '';
                }
            });
        }

        // 2. CLEANUP
        if (bestContent) {
            const $clean = cheerio.load(bestContent);

            // Remove typical 'Share via' / 'Copy Link' clutter from original sites
            $clean('div, span, p, button, a').each((_, el) => {
                const text = $(el).text().toLowerCase().trim();
                if (text === 'share via' || text === 'copy link' || text.includes('follow us on') || text.includes('sign up for')) {
                    $(el).remove();
                }
            });

            // Remove headers that duplicate the title
            $clean('h1, h2, h3').each((_, el) => {
                const text = $(el).text().trim();
                const pageTitle = $('title').text().trim();
                if (text === pageTitle || pageTitle.includes(text) || text.length < 3) {
                    $(el).remove();
                }
            });

            // Remove all purely empty tags that add whitespace
            $clean('*').each((_, el) => {
                if ($(el).children().length === 0 && $(el).text().trim().length === 0) {
                    $(el).remove();
                }
            });

            bestContent = $clean('body').html() || '';
        }

        const mainContent = bestContent;
        const textContent = cheerio.load(mainContent).text().trim().replace(/\s+/g, ' ');

        const result: ScrapedArticle = {
            title: $('title').text() || '',
            content: mainContent,
            textContent: textContent,
            excerpt: '',
            byline: '',
            siteName: url.split('/')[2],
        };

        if (result.textContent.length > 500) {
            scraperCache.set(url, { data: result, timestamp: Date.now() });
            console.log(`✅ Scraped ${result.textContent.length} characters.`);
        }

        return result;
    } catch (error: any) {
        console.error(`Scraper error:`, error.message);
        return null;
    }
}
