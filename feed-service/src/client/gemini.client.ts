import { Injectable } from '@nestjs/common';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiClient {
  private readonly model: GenerativeModel;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined');

    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  }

  async extractTopics(caption?: string, tags?: string[]): Promise<string[]> {
    const parts: string[] = [];

    if (caption) parts.push(`Caption: "${caption}"`);
    if (tags?.length) parts.push(`Existing tags: ${tags.join(', ')}`);

    if (!parts.length) return [];

    const prompt = `
  Extract exactly 7 short topic tags from the following:
  ${parts.join('\n')}
  
  Rules:
  - Return ONLY a valid JSON array of strings, nothing else
  - Tags must be lowercase, use hyphen instead of spaces
  - No markdown, no explanation, no backticks
  - If not enough topics, repeat or generalize
  
  Output format: ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7"]
`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleaned = text.replace(/```json|```|\n/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (
        !Array.isArray(parsed) ||
        !parsed.every((t) => typeof t === 'string')
      ) {
        return [];
      }

      return parsed.slice(0, 7);
    } catch {
      return [];
    }
  }
}
