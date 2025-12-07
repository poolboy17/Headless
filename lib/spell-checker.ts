import OpenAI from 'openai';
import { createHash } from 'crypto';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }
  return openaiClient;
}

interface SpellCheckResult {
  correctedText: string;
  hadCorrections: boolean;
}

const contentCache = new Map<string, SpellCheckResult>();

function createCacheKey(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function extractTextFromHtml(html: string): { text: string; segments: Array<{ start: number; end: number; isText: boolean }> } {
  const segments: Array<{ start: number; end: number; isText: boolean }> = [];
  const textParts: string[] = [];
  
  let lastIndex = 0;
  const tagPattern = /<[^>]+>/g;
  let match;
  
  while ((match = tagPattern.exec(html)) !== null) {
    if (match.index > lastIndex) {
      const textContent = html.slice(lastIndex, match.index);
      if (textContent.trim()) {
        segments.push({ start: lastIndex, end: match.index, isText: true });
        textParts.push(textContent);
      } else {
        segments.push({ start: lastIndex, end: match.index, isText: false });
      }
    }
    segments.push({ start: match.index, end: match.index + match[0].length, isText: false });
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < html.length) {
    const textContent = html.slice(lastIndex);
    if (textContent.trim()) {
      segments.push({ start: lastIndex, end: html.length, isText: true });
      textParts.push(textContent);
    } else {
      segments.push({ start: lastIndex, end: html.length, isText: false });
    }
  }
  
  return { text: textParts.join('\n---SEGMENT---\n'), segments };
}

export async function checkAndFixSpelling(html: string): Promise<SpellCheckResult> {
  if (!html || html.trim().length === 0) {
    return { correctedText: html, hadCorrections: false };
  }

  const openai = getOpenAIClient();
  if (!openai) {
    return { correctedText: html, hadCorrections: false };
  }

  const cacheKey = createCacheKey(html);
  const cached = contentCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const { text: extractedText, segments } = extractTextFromHtml(html);
    
    if (!extractedText.trim()) {
      return { correctedText: html, hadCorrections: false };
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional proofreader. Fix spelling and grammar errors in the text provided. 
Keep the exact same structure and formatting. Only fix actual errors - do not rewrite or change the style.
The text segments are separated by "---SEGMENT---". Keep these separators in your response.
If there are no errors, return the text exactly as provided.
Do not add any explanations, just return the corrected text.`
        },
        {
          role: 'user',
          content: extractedText
        }
      ],
      temperature: 0.1,
      max_tokens: 4000,
    });

    const correctedText = response.choices[0]?.message?.content;
    
    if (!correctedText) {
      return { correctedText: html, hadCorrections: false };
    }

    const correctedParts = correctedText.split('\n---SEGMENT---\n');
    
    let result = html;
    let textPartIndex = 0;
    let offset = 0;
    
    for (const segment of segments) {
      if (segment.isText && textPartIndex < correctedParts.length) {
        const originalText = html.slice(segment.start, segment.end);
        const correctedPart = correctedParts[textPartIndex];
        
        if (originalText !== correctedPart) {
          const adjustedStart = segment.start + offset;
          const adjustedEnd = segment.end + offset;
          result = result.slice(0, adjustedStart) + correctedPart + result.slice(adjustedEnd);
          offset += correctedPart.length - originalText.length;
        }
        
        textPartIndex++;
      }
    }

    const hadCorrections = result !== html;
    const spellCheckResult = { correctedText: result, hadCorrections };
    
    contentCache.set(cacheKey, spellCheckResult);
    
    if (contentCache.size > 100) {
      const firstKey = contentCache.keys().next().value;
      if (firstKey) contentCache.delete(firstKey);
    }
    
    return spellCheckResult;
  } catch (error) {
    console.error('Spell check error:', error);
    return { correctedText: html, hadCorrections: false };
  }
}

export async function checkSpellingBatch(contents: string[]): Promise<SpellCheckResult[]> {
  const results = await Promise.all(
    contents.map(content => checkAndFixSpelling(content))
  );
  return results;
}
