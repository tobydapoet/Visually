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
    this.logger.log(`API key loaded: ${apiKey.slice(0, 8)}...`);

    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: 'Bạn là trợ lý AI hữu ích.',
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 2048,
      },
    });
    this.logger.log('Gemini model initialized');
  }

  initSession(conversationId: number, history: Content[] = []): void {
    this.logger.log(
      `Initializing session for conversation ${conversationId}, history length: ${history.length}`,
    );
    const session = this.model.startChat({ history });
    this.sessions.set(conversationId, session);
    this.logger.log(`Session created for conversation ${conversationId}`);
  }

  hasSession(conversationId: number): boolean {
    const has = this.sessions.has(conversationId);
    this.logger.log(`hasSession(${conversationId}): ${has}`);
    return has;
  }

  async sendMessage(conversationId: number, message: string): Promise<string> {
    if (!this.hasSession(conversationId)) {
      this.initSession(conversationId);
    }

    try {
      this.logger.log(`Sending to Gemini: "${message}"`);
      const session = this.sessions.get(conversationId)!;

      this.logger.log(`Starting Promise.race with 15s timeout...`);
      const result = await Promise.race([
        session.sendMessage(message).then((r) => {
          this.logger.log(`Gemini responded successfully!`);
          return r;
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => {
            this.logger.error(`Gemini timeout after 15s!`);
            reject(new Error('Gemini timeout after 15s'));
          }, 15000),
        ),
      ]);

      const text = (result as any).response.text();
      this.logger.log(`Gemini reply: "${text.slice(0, 100)}..."`);
      return text;
    } catch (err: any) {
      this.logger.error(`Gemini error: ${err.message}`);
      throw err;
    }
  }

  clearSession(conversationId: number): void {
    this.logger.log(`Clearing session for conversation ${conversationId}`);
    this.sessions.delete(conversationId);
    this.logger.log(`Session cleared for conversation ${conversationId}`);
  }
}
