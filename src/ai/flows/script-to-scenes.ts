'use server';

/**
 * @fileOverview An AI agent that splits a script into scenes.
 *
 * - scriptToScenes - A function that handles the script splitting process.
 * - ScriptToScenesInput - The input type for the scriptToScenes function.
 * - ScriptToScenesOutput - The return type for the scriptToScenes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScriptToScenesInputSchema = z.string().describe('The script to split into scenes.');
export type ScriptToScenesInput = z.infer<typeof ScriptToScenesInputSchema>;

const ScriptToScenesOutputSchema = z.array(z.string()).describe('An array of scenes.');
export type ScriptToScenesOutput = z.infer<typeof ScriptToScenesOutputSchema>;

export async function scriptToScenes(script: ScriptToScenesInput): Promise<ScriptToScenesOutput> {
  return scriptToScenesFlow(script);
}

const prompt = ai.definePrompt({
  name: 'scriptToScenesPrompt',
  input: {schema: ScriptToScenesInputSchema},
  output: {schema: ScriptToScenesOutputSchema},
  prompt: `You are a script breakdown expert.  Your job is to take a script and break it down into scenes.

Here is the script:

{{{input}}}

Please return a JSON array of strings, where each string is a scene from the script.`,
});

const scriptToScenesFlow = ai.defineFlow(
  {
    name: 'scriptToScenesFlow',
    inputSchema: ScriptToScenesInputSchema,
    outputSchema: ScriptToScenesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
