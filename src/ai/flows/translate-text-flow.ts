// src/ai/flows/translate-text-flow.ts
'use server';
/**
 * @fileOverview A Genkit flow for translating text between languages.
 *
 * - translateText - A function that translates a given text to a target language.
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
  return translateTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
  prompt: `Translate the following text to {{targetLanguage}}.
If the text is a list of items or bullet points, maintain the list structure in the translation.
If the text appears to be a proper noun (like a company name, specific technology name, or a person's name) that typically isn't translated, return it as is. However, translate descriptive job titles, summaries, responsibilities, and general skills.

Text to translate:
{{{textToTranslate}}}

Translated text (in {{targetLanguage}}):`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async input => {
    // Handle empty or whitespace-only strings to avoid unnecessary API calls
    if (!input.textToTranslate.trim()) {
      return { translatedText: input.textToTranslate };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
