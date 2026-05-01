import { Injectable, Logger } from '@nestjs/common';
import {
  GoogleGenerativeAI,
  ChatSession,
  Content,
  GenerativeModel,
} from '@google/generative-ai';

@Injectable()
export class GeminiClient {
  private readonly logger = new Logger(GeminiClient.name);
  private readonly model: GenerativeModel;
  private readonly sessions = new Map<number, ChatSession>();

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined');

    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: 'emini-2.5-flash',
      systemInstruction: 'Bạn là trợ lý AI hữu ích.',
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 2048,
      },
    });
  }

  initSession(conversationId: number, history: Content[] = []): void {
    const session = this.model.startChat({ history });
    this.sessions.set(conversationId, session);

    this.logger.log(`Session created for conversation ${conversationId}`);
  }

  hasSession(conversationId: number): boolean {
    return this.sessions.has(conversationId);
  }

  async sendMessage(conversationId: number, message: string): Promise<string> {
    if (!this.hasSession(conversationId)) {
      this.initSession(conversationId);
    }

    try {
      this.logger.log(`Sending to Gemini: "${message}"`);
      const session = this.sessions.get(conversationId)!;
      const result = await session.sendMessage(message);
      const text = result.response.text();
      return text;
    } catch (err: any) {
      throw err;
    }
  }

  clearSession(conversationId: number): void {
    this.sessions.delete(conversationId);
    this.logger.log(`Session cleared for conversation ${conversationId}`);
  }
}
