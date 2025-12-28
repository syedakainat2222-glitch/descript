'use server';

/**
 * @fileOverview AI agent that suggests background music based on the mood of the script.
 *
 * - suggestBackgroundMusic - A function that suggests background music.
 * - SuggestBackgroundMusicInput - The input type for the suggestBackgroundMusic function.
 * - SuggestBackgroundMusicOutput - The return type for the suggestBackgroundMusic function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestBackgroundMusicInputSchema = z.object({
  script: z.string().describe('The script for which background music is needed.'),
});
export type SuggestBackgroundMusicInput = z.infer<
  typeof SuggestBackgroundMusicInputSchema
>;

const SuggestBackgroundMusicOutputSchema = z.object({
  musicSuggestion: z
    .string()
    .describe(
      'A suggestion for background music that matches the mood of the script.'
    ),
});
export type SuggestBackgroundMusicOutput = z.infer<
  typeof SuggestBackgroundMusicOutputSchema
>;

export async function suggestBackgroundMusic(
  input: SuggestBackgroundMusicInput
): Promise<SuggestBackgroundMusicOutput> {
  return suggestBackgroundMusicFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestBackgroundMusicPrompt',
  input: {schema: SuggestBackgroundMusicInputSchema},
  output: {schema: SuggestBackgroundMusicOutputSchema},
  prompt: `You are an AI music expert. Based on the following script, suggest background music that matches the mood. Be creative.

Script: {{{script}}}`,
});

const suggestBackgroundMusicFlow = ai.defineFlow(
  {
    name: 'suggestBackgroundMusicFlow',
    inputSchema: SuggestBackgroundMusicInputSchema,
    outputSchema: SuggestBackgroundMusicOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
