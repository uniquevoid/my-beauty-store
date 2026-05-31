import { BadRequestException, Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { AiService, type ExtractedResume } from '../ai/ai.service';
import { SupabaseService } from '../supabase/supabase.service';

export type ResumeExtractionMode = 'application' | 'recommendations';

@Injectable()
export class ResumeFileService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly ai: AiService,
  ) {}

  async uploadAndExtract(
    storagePrefix: string,
    file: Express.Multer.File,
    options?: { mode?: ResumeExtractionMode },
  ): Promise<{ resume_storage_path: string; extracted: ExtractedResume }> {
    const safeName = (file.originalname || 'resume')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 100);

    const ext = safeName.includes('.') ? safeName.split('.').pop() : undefined;
    const objectPath = `${storagePrefix}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext ?? 'bin'}`;

    const upload = await this.supabase.adminClient.storage
      .from('resumes')
      .upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (upload.error) throw upload.error;

    const text = await this.ai.extractTextFromResume({ mimetype: file.mimetype, buffer: file.buffer });
    if (!text) throw new BadRequestException('Unable to extract any text from the resume.');

    const mode = options?.mode ?? 'recommendations';
    const extracted =
      mode === 'application'
        ? await this.ai.extractStructuredResumeForApplication(text)
        : await this.ai.extractStructuredResume(text);

    return { resume_storage_path: objectPath, extracted };
  }
}
