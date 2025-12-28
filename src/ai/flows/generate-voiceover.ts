'use server';

/**
 * @fileOverview Generates a natural-sounding voiceover for a given script.
 *
 * - generateVoiceover - A function that generates the voiceover.
 * - GenerateVoiceoverInput - The input type for the generateVoiceover function.
 * - GenerateVoiceoverOutput - The return type for the generateVoiceover function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const GenerateVoiceoverInputSchema = z.object({
  script: z.string().describe('The script to generate a voiceover for.'),
});
export type GenerateVoiceoverInput = z.infer<typeof GenerateVoiceoverInputSchema>;

const GenerateVoiceoverOutputSchema = z.object({
  voiceover: z
    .string()
    .describe(
      'The generated voiceover as a data URI in WAV format (data:audio/wav;base64,<b64_encoded_audio>)'
    ),
});
export type GenerateVoiceoverOutput = z.infer<typeof GenerateVoiceoverOutputSchema>;

export async function generateVoiceover(input: GenerateVoiceoverInput): Promise<GenerateVoiceoverOutput> {
  return generateVoiceoverFlow(input);
}

const generateVoiceoverFlow = ai.defineFlow(
  {
    name: 'generateVoiceoverFlow',
    inputSchema: GenerateVoiceoverInputSchema,
    outputSchema: GenerateVoiceoverOutputSchema,
  },
  async (input) => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
      prompt: input.script,
    });
    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    return {
      voiceover: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
