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
  const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-pro',
    'gemini-1.0-pro'
  ];

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });

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
    } catch (error: any) {
      console.warn(`Rephrase failed for model ${modelName}:`, error.message);
    }
  }

  throw new Error('All Gemini models failed to rephrase article');
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

export async function expandNewsSnippet(
  title: string,
  snippet: string,
  category?: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return snippet ? `<p>${snippet}</p>` : '';

  // Wider range of models to overcome potential region/tier restrictions
  const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
    'gemini-1.0-pro',
    'gemini-pro'
  ];

  const snippetLen = snippet?.length || 0;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = `
        You are a top-tier news journalist. Expand this short news snippet into a comprehensive, detailed, and professional news article.
        
        Headline: ${title}
        Original Snippet: ${snippet}
        Category: ${category || 'General News'}
        
        Instructions:
        1. Write a MINIMUM of 400-600 words.
        2. Provide deep context, historical background (if applicable), and analysis.
        3. Maintain a formal journalistic tone throughout.
        4. Format the article with clear HTML <p> tags and <h3> headings for different sections.
        5. DO NOT mention you are an AI or that you are expanding a text.
        
        Return ONLY the clean HTML article.
      `;

      const result = await model.generateContent(prompt);
      const content = result.response.text().trim();
      const cleaned = content.replace(/```html|```/g, '').trim();

      // Ensure it's actually an expansion
      if (cleaned.length > snippetLen * 1.5 && cleaned.length > 300) {
        return cleaned;
      }
    } catch (error: any) {
      console.warn(`Model ${modelName} failed/rejected for ${title}:`, error.message);
    }
  }

  // Fallback to original snippet if AI expansion fails or is poor
  return snippet ? `<p>${snippet}</p>` : '';
}
