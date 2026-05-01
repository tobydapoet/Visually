import { Injectable } from '@nestjs/common';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiClient {
  private readonly model: GenerativeModel;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined');

    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  }

  async extractTopics(caption?: string, tags?: string[]): Promise<string[]> {
    const parts: string[] = [];

    if (caption) parts.push(`Caption: "${caption}"`);
    if (tags?.length) parts.push(`Existing tags: ${tags.join(', ')}`);

    if (!parts.length) return [];

    const prompt = `
      Extract 7 short topic tags from the following information:
      ${parts.join('\n')}
      Rules:
      - Return ONLY a JSON array of strings
      - Tags must be lowercase, no spaces (use hyphen if needed)
      - No explanation, no markdown, just the array
      Example: ["coffee", "morning-routine", "hanoi", "cafe", "food"]
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleaned = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return [];
    }
  }
}
