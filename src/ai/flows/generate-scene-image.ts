'use server';

/**
 * @fileOverview Generates an image for a scene and uploads it to Supabase storage.
 *
 * - generateSceneImage - A function that generates and uploads an image.
 * - GenerateSceneImageInput - The input type for the generateSceneImage function.
 * - GenerateSceneImageOutput - The return type for the generateSceneImage function.
 */

import { ai } from '@/ai/genkit';
import { supabase } from '@/lib/supabase';
import { z } from 'genkit';
import { v4 as uuidv4 } from 'uuid';

const GenerateSceneImageInputSchema = z.object({
  sceneText: z.string().describe('The text of the scene to generate an image for.'),
});
export type GenerateSceneImageInput = z.infer<typeof GenerateSceneImageInputSchema>;

const GenerateSceneImageOutputSchema = z.object({
  imageUrl: z.string().describe('The public URL of the generated image in Supabase storage.'),
});
export type GenerateSceneImageOutput = z.infer<typeof GenerateSceneImageOutputSchema>;

export async function generateSceneImage(input: GenerateSceneImageInput): Promise<GenerateSceneImageOutput> {
  return generateSceneImageFlow(input);
}

const generateSceneImageFlow = ai.defineFlow(
  {
    name: 'generateSceneImageFlow',
    inputSchema: GenerateSceneImageInputSchema,
    outputSchema: GenerateSceneImageOutputSchema,
  },
  async ({ sceneText }) => {
    // 1. Generate an image based on the scene text
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `Generate a cinematic, high-quality image for the following scene: "${sceneText}"`,
    });

    const imageData = media.url;
    if (!imageData) {
      throw new Error('Image generation failed.');
    }

    // 2. Upload the image to Supabase
    const imageBuffer = Buffer.from(imageData.substring(imageData.indexOf(',') + 1), 'base64');
    const imagePath = `scene-images/${uuidv4()}.png`;
    
    const { data, error } = await supabase.storage
      .from('autocinema')
      .upload(imagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Failed to upload image to Supabase: ${error.message}`);
    }

    // 3. Get the public URL
    const { data: publicUrlData } = supabase.storage.from('autocinema').getPublicUrl(data.path);

    if (!publicUrlData) {
        throw new Error('Failed to get public URL for the image.');
    }

    return {
      imageUrl: publicUrlData.publicUrl,
    };
  }
);
