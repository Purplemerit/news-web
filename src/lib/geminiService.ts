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
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are a professional news journalist. I have a news headline and a short snippet, but the full article is unavailable.
      Please write a comprehensive, professional, and engaging news article based on this information.
      
      Headline: ${title}
      Snippet: ${snippet}
      Category: ${category || 'General News'}
      
      Instructions:
      1. Write at least 4-6 detailed paragraphs.
      2. Maintain a professional journalistic tone.
      3. Use the snippet as the starting point and expand on the context logically.
      4. Format the output as clean HTML (use <p>, <h3>, <ul> tags where appropriate).
      5. Do not include any filler text or "Here is your article..." messages.
      6. If the snippet is extremely short, use your general knowledge to provide broader context related to the headline.
      
      Return ONLY the HTML content.
    `;

    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();

    // Remove potential markdown code blocks
    return content.replace(/```html|```/g, '').trim();
  } catch (error) {
    console.error('Error expanding news snippet with Gemini:', error);
    return `<p>${snippet}</p><p><em>(Note: We were unable to retrieve the full article from the source at this time.)</em></p>`;
  }
}
