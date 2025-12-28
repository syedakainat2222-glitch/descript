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
  prompt: `You are a script breakdown expert. Your job is to take a script and break it down into individual scenes. Each sentence in the provided script must be treated as a separate scene.

For example, if the input script is: "A majestic dragon soars over a mystical forest at dawn. It lets out a mighty roar. The trees tremble in response."

Your output MUST be a JSON array of strings like this:
["A majestic dragon soars over a mystical forest at dawn.", "It lets out a mighty roar.", "The trees tremble in response."]

Do not add any extra commentary or text. Only return the JSON array.

Here is the script:

{{{input}}}`,
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
