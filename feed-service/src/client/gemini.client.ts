import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiClient {
  private readonly model;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined');

    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async extractTopics(caption: string): Promise<string[]> {
    const prompt = `
      Extract 5 short topic tags from this caption: "${caption}"
      Rules:
      - Return ONLY a JSON array of strings
      - Tags must be lowercase, no spaces (use hyphen if needed)
      - No explanation, no markdown, just the array
      Example: ["coffee", "morning-routine", "hanoi", "cafe", "food"]
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text().trim();
      return JSON.parse(text);
    } catch (e) {
      return [];
    }
  }
}
