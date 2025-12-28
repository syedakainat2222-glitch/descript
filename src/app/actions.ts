'use server';

import { z } from 'zod';
import { scriptToScenes } from '@/ai/flows/script-to-scenes';
import { generateVoiceover } from '@/ai/flows/generate-voiceover';
import { suggestBackgroundMusic } from '@/ai/flows/suggest-background-music';
import type { ActionState, Scene } from '@/lib/types';

const scriptSchema = z.string().min(10, { message: 'Script must be at least 10 characters long.' }).max(2000, { message: 'Script cannot be more than 2000 characters.' });

export async function generateCinema(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const scriptValue = formData.get('script');

  const validation = scriptSchema.safeParse(scriptValue);

  if (!validation.success) {
    return {
      data: null,
      status: 'error',
      error: validation.error.errors.map((e) => e.message).join(', '),
    };
  }
  const script = validation.data;

  try {
    const [scenesTexts, voiceoverResult, musicResult] = await Promise.all([
      scriptToScenes(script),
      generateVoiceover({ script }),
      suggestBackgroundMusic({ script }),
    ]);

    if (!scenesTexts || scenesTexts.length === 0) {
      return { data: null, status: 'error', error: 'Could not generate scenes from the script.' };
    }
    
    if (!voiceoverResult?.voiceover) {
      return { data: null, status: 'error', error: 'Could not generate voiceover.' };
    }

    if (!musicResult?.musicSuggestion) {
        return { data: null, status: 'error', error: 'Could not suggest music.' };
    }

    const scenes: Scene[] = scenesTexts.map((sceneText, index) => {
      const hint = sceneText.split(' ').slice(0, 2).join(' ');
      return {
        text: sceneText,
        imageUrl: `https://picsum.photos/seed/${index}-${script.length}/1280/720`,
        imageHint: hint,
      };
    });

    return {
      status: 'success',
      error: null,
      data: {
        scenes,
        voiceoverUrl: voiceoverResult.voiceover,
        musicSuggestion: musicResult.musicSuggestion,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      data: null,
      status: 'error',
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
