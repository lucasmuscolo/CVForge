
// src/ai/flows/translate-text-flow.ts
'use server';
/**
 * @fileOverview A Genkit flow to translate text to a specified target language.
 *
 * - translateText - A function that translates a given text.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateTextInputSchema = z.object({
  textToTranslate: z.string().describe('The text that needs to be translated.'),
  targetLanguage: z.enum(['en', 'es']).describe('The target language for the translation (English or Spanish).'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text in the target language.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  // If the text is empty or whitespace, no need to call the API
  if (!input.textToTranslate.trim()) {
    return { translatedText: input.textToTranslate };
  }
  return translateTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
  prompt: `Translate the following text to {{targetLanguage}}.
If the text is already in {{targetLanguage}}, return it as is.
Do not add any introductory phrases like "Here is the translation:" or similar, just return the translated text.

Original Text: {{{textToTranslate}}}

Translated Text (in {{targetLanguage}}):`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    // Defensive check for empty or whitespace-only strings to avoid unnecessary API calls
    if (!input.textToTranslate.trim()) {
      return { translatedText: input.textToTranslate };
    }
    try {
        const {output} = await prompt(input);
        return output!;
    } catch (error) {
        console.error(`[translateTextFlow] Error translating text to ${input.targetLanguage}:`, error);
        // Fallback to original text in case of error
        return { translatedText: input.textToTranslate };
    }
  }
);
