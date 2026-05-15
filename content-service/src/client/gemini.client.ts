import { Injectable } from '@nestjs/common';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiClient {
  private readonly model: GenerativeModel;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined');

    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
  }

  async validateFiles(files: Express.Multer.File[]) {
    const prompt = `
        Analyze this uploaded image for unsafe or harmful social media content.

        Return ONLY valid JSON.

        Schema:
        {
        "safe": boolean,
        "categories": string[],
        "severity": "low" | "medium" | "high",
        "reason": string
        }

        Detect:
        - nudity
        - sexual content
        - minors
        - violence
        - gore
        - self-harm
        - hate symbols
        - extremist content
        - drugs
        - weapons
        - harassment
        - graphic content
        - spam/scam imagery

        Rules:
        - JSON only
        - No markdown
        - No explanation
        `;

    const results = await Promise.all(
      files.map(async (file) => {
        try {
          const base64Image = file.buffer.toString('base64');

          const result = await this.model.generateContent([
            {
              text: prompt,
            },
            {
              inlineData: {
                mimeType: file.mimetype,
                data: base64Image,
              },
            },
          ]);

          const text = result.response
            .text()
            .replace(/```json|```/g, '')
            .trim();

          return {
            fileName: file.originalname,
            ...JSON.parse(text),
          };
        } catch {
          return {
            fileName: file.originalname,
            safe: false,
            categories: ['parse_error'],
            severity: 'high',
            reason: 'Failed to validate image',
          };
        }
      }),
    );

    const unsafeFiles = results.filter((r) => !r.safe);

    return {
      safe: unsafeFiles.length === 0,
      results,
      unsafeFiles,
    };
  }
}
