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
        console.log(`🔍 Scraping started for: ${url}`);
        const response = await fetchWithTimeout(url);
        if (!response.ok) {
            console.error(`❌ HTTP Error ${response.status} for ${url}`);
            return null;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove junk
        $('script, style, nav, footer, header, iframe, noscript, .ads, #ads, aside, .sidebar').remove();

        // 1. DENSE TEXT EXTRACTION
        let bestBlock: any = null;
        let maxScore = 0;

        $('div, section, article, main').each((_, el) => {
            const $el = $(el);
            let score = 0;

            // Score based on paragraphs
            $el.find('p').each((_, p) => {
                const text = $(p).text().trim();
                if (text.length > 80) score += 20;
                if (text.length > 150) score += 40;
            });

            // Adjust by density
            const textLen = $el.text().trim().length;
            const linkLen = $el.find('a').text().trim().length;
            const density = textLen > 0 ? (textLen - linkLen) / textLen : 0;
            score *= density;

            if (score > maxScore) {
                maxScore = score;
                bestBlock = $el;
            }
        });

        let mainContent = '';
        if (bestBlock && maxScore > 20) {
            console.log(`✅ Best block found with score: ${maxScore}`);
            bestBlock.find('button, .share, .author, .date, .tags').remove();
            mainContent = bestBlock.html() || '';
        } else {
            console.log(`⚠️ No dense block found, falling back to body.`);
            mainContent = $('body').html() || '';
        }

        // 2. DEDUPLICATION
        const $clean = cheerio.load(mainContent);

        // Remove duplicate headings at top
        $clean('h1, h2, h3').slice(0, 2).remove();

        // Remove images right at the top (usually hero duplicates)
        $clean('body > *:nth-child(-n+3)').each((_, el) => {
            if ($(el).is('img') || $(el).find('img').length > 0) {
                $(el).remove();
            }
        });

        mainContent = $clean('body').html() || '';
        const textContent = $clean('body').text().trim().replace(/\s+/g, ' ');

        const result: ScrapedArticle = {
            title: $('title').text() || '',
            content: mainContent,
            textContent: textContent,
            excerpt: '',
            byline: '',
            siteName: url.split('/')[2],
        };

        if (result.textContent.length > 300) {
            scraperCache.set(url, { data: result, timestamp: Date.now() });
            console.log(`🎉 Article scraped successfully: ${result.textContent.length} characters.`);
        } else {
            console.warn(`📉 Scraped content too thin: ${result.textContent.length} characters.`);
        }

        return result;
    } catch (error: any) {
        console.error(`❌ Scraper error for ${url}:`, error.message);
        return null;
    }
}
