'use server';

import { z } from 'zod';
import { automaticSubtitleGeneration } from './automatic-subtitle-generation';
import { detectLanguage } from './detect-language';
import { supabase } from '@/lib/supabase';

export async function processVideo(input: { publicId: string; languageCode?: string }) {
    const ProcessVideoInputSchema = z.object({
        publicId: z.string().min(1, "Public ID is required"),
        languageCode: z.string().optional(),
    });

    const validatedInput = ProcessVideoInputSchema.parse(input);
    
    console.log('Supabase Public ID:', validatedInput.publicId);
    
    // Create a signed URL that is valid for 1 hour.
    const { data, error } = await supabase.storage
        .from('videos')
        .createSignedUrl(validatedInput.publicId, 3600);

    if (error || !data) {
        throw new Error('Failed to generate signed video URL from Supabase.');
    }

    const videoUrl = data.signedUrl;

    console.log('Generated Supabase Signed URL:', videoUrl);

    let languageCode = validatedInput.languageCode;
    if (!languageCode || languageCode === 'auto') {
        languageCode = await detectLanguage({ videoUrl });
    }

    const subtitles = await automaticSubtitleGeneration({
        videoUrl,
        languageCode,
    });

    return {
        subtitles,
        videoUrl, // Return the signed URL
    };
}
