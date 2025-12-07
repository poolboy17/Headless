/**
 * AI Content Generator Module
 * 
 * Uses OpenAI to enhance tour descriptions with engaging, SEO-friendly content
 */

import OpenAI from 'openai';

interface TourInput {
  productCode: string;
  title: string;
  description: string;
  duration: string;
  destinationId: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DESTINATION_NAMES: Record<string, string> = {
  '684': 'New Orleans',
  '28892': 'Salem',
  '60763': 'Savannah',
};

export async function generateTourContent(tour: TourInput): Promise<string> {
  // If no API key, return original description
  if (!process.env.OPENAI_API_KEY) {
    console.log('No OpenAI key - using original description');
    return formatBasicContent(tour.description);
  }

  try {
    const destinationName = DESTINATION_NAMES[tour.destinationId] || 'this haunted destination';
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a writer for Cursed Tours, a paranormal investigation and ghost tour blog. 
Your tone is intriguing, atmospheric, and respectful of the supernatural. 
Write engaging, SEO-friendly content that captures the mystery and history of haunted locations.
Use WordPress Gutenberg block format for the output.
Do not use emojis.`,
        },
        {
          role: 'user',
          content: `Enhance this tour description for our website. Make it compelling and atmospheric while keeping factual details accurate.

Tour: ${tour.title}
Location: ${destinationName}
Duration: ${tour.duration}
Original Description: ${tour.description}

Write 2-3 paragraphs that:
1. Set the atmospheric scene
2. Highlight what makes this tour unique
3. Mention any historical or paranormal significance

Format as WordPress Gutenberg blocks (wp:paragraph, wp:heading, etc).`,
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    
    if (content) {
      console.log(`Generated enhanced content for: ${tour.title}`);
      return content;
    }
    
    return formatBasicContent(tour.description);
  } catch (error) {
    console.warn('AI content generation failed:', error);
    return formatBasicContent(tour.description);
  }
}

function formatBasicContent(description: string): string {
  // Split into paragraphs and wrap in Gutenberg blocks
  const paragraphs = description
    .split(/\n\n+/)
    .filter(p => p.trim())
    .map(p => `<!-- wp:paragraph -->\n<p>${p.trim()}</p>\n<!-- /wp:paragraph -->`)
    .join('\n\n');

  return paragraphs || `<!-- wp:paragraph -->\n<p>${description}</p>\n<!-- /wp:paragraph -->`;
}
