import { Injectable } from '@nestjs/common';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiClient {
  private readonly model: GenerativeModel;

  private readonly SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
  ];

  private readonly SUPPORTED_VIDEO_TYPES = [
    'video/mp4',
    'video/mpeg',
    'video/mov',
    'video/avi',
    'video/x-flv',
    'video/mpg',
    'video/webm',
    'video/wmv',
    'video/3gpp',
  ];

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined');

    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
  }

  private isImage(mimeType: string): boolean {
    return this.SUPPORTED_IMAGE_TYPES.includes(mimeType);
  }

  private isVideo(mimeType: string): boolean {
    return this.SUPPORTED_VIDEO_TYPES.includes(mimeType);
  }

  private isSupportedFile(mimeType: string): boolean {
    return this.isImage(mimeType) || this.isVideo(mimeType);
  }

  async validateFiles(files: Express.Multer.File[]) {
    const prompt = `
        Analyze this uploaded file (image or video) for unsafe or harmful social media content.

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
        if (!this.isSupportedFile(file.mimetype)) {
          return {
            fileName: file.originalname,
            safe: false,
            categories: ['unsupported_file_type'],
            severity: 'high' as const,
            reason: `File type "${file.mimetype}" is not supported. Only images and videos are allowed.`,
          };
        }

        try {
          const base64Data = file.buffer.toString('base64');

          const result = await this.model.generateContent([
            { text: prompt },
            {
              inlineData: {
                mimeType: file.mimetype,
                data: base64Data,
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
            severity: 'high' as const,
            reason: 'Failed to validate file',
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
