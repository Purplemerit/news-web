import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface RephraseResult {
  originalTitle: string;
  rephrasedTitle: string;
  originalContent: string;
  rephrasedContent: string;
  originalExcerpt?: string;
  rephrasedExcerpt?: string;
}

/**
 * Rephrase news article using Gemini API
 */
export async function rephraseArticle(
  title: string,
  content: string,
  excerpt?: string
): Promise<RephraseResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Rephrase title
    const titlePrompt = `Rephrase this news headline to be unique while keeping the same meaning and tone. Keep it concise (under 100 characters):

"${title}"

Return only the rephrased headline, nothing else.`;

    const titleResult = await model.generateContent(titlePrompt);
    const rephrasedTitle = titleResult.response.text().trim().replace(/['"]/g, '');

    // Rephrase content
    const contentPrompt = `Rephrase this news article to be unique while preserving all facts, information, and tone. Make it engaging and well-written. Keep similar length:

${content}

Return only the rephrased article, nothing else.`;

    const contentResult = await model.generateContent(contentPrompt);
    const rephrasedContent = contentResult.response.text().trim();

    // Rephrase excerpt if provided
    let rephrasedExcerpt = excerpt;
    if (excerpt) {
      const excerptPrompt = `Rephrase this news summary to be unique while keeping the same meaning (under 200 characters):

"${excerpt}"

Return only the rephrased summary, nothing else.`;

      const excerptResult = await model.generateContent(excerptPrompt);
      rephrasedExcerpt = excerptResult.response.text().trim().replace(/['"]/g, '');
    }

    return {
      originalTitle: title,
      rephrasedTitle,
      originalContent: content,
      rephrasedContent,
      originalExcerpt: excerpt,
      rephrasedExcerpt,
    };
  } catch (error) {
    console.error('Error rephrasing article with Gemini:', error);
    throw new Error('Failed to rephrase article');
  }
}

/**
 * Batch rephrase multiple articles
 */
export async function rephraseArticles(
  articles: Array<{ title: string; content: string; excerpt?: string }>
): Promise<RephraseResult[]> {
  const results: RephraseResult[] = [];

  for (const article of articles) {
    try {
      const rephrased = await rephraseArticle(
        article.title,
        article.content,
        article.excerpt
      );
      results.push(rephrased);

      // Add delay to avoid rate limits (Gemini has 15 RPM limit on free tier)
      await new Promise(resolve => setTimeout(resolve, 4000));
    } catch (error) {
      console.error(`Failed to rephrase article: ${article.title}`, error);
      // Continue with next article
    }
  }

  return results;
}

/**
 * Expand a news snippet into a full article using Gemini
 * Useful when scraping fails but we have the title and a short summary
 */
export async function expandNewsSnippet(
  title: string,
  snippet: string,
  category?: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is missing, returning snippet as fallback');
    return snippet ? `<p>${snippet}</p>` : '';
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are a professional journalist. Write a comprehensive 4-6 paragraph news article based on this headline and snippet.
      
      Headline: ${title}
      Snippet: ${snippet}
      Category: ${category || 'General News'}
      
      Instructions:
      1. Write at least 350-500 words.
      2. Format as clean HTML paragraphs (<p>).
      3. Do not include any meta-talk or filler.
      
      Return ONLY the HTML.
    `;

    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();

    return content.replace(/```html|```/g, '').trim();
  } catch (error: any) {
    console.error('Gemini expansion failed:', error.message);
    return snippet ? `<p>${snippet}</p><p><em>(Note: AI enhancement unavailable - ${error.message})</em></p>` : '';
  }
}
