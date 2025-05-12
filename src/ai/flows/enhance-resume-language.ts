// src/ai/flows/enhance-resume-language.ts
'use server';
/**
 * @fileOverview An AI-powered tool that suggests improvements to the language used in resume sections.
 *
 * - enhanceResumeLanguage - A function that enhances the language in resume sections.
 * - EnhanceResumeLanguageInput - The input type for the enhanceResumeLanguage function.
 * - EnhanceResumeLanguageOutput - The return type for the enhanceResumeLanguage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceResumeLanguageInputSchema = z.object({
  sectionText: z
    .string()
    .describe('The text from the resume section that needs to be enhanced.'),
  language: z.enum(['en', 'es']).describe('The language for the response (English or Spanish).'),
});
export type EnhanceResumeLanguageInput = z.infer<typeof EnhanceResumeLanguageInputSchema>;

const EnhanceResumeLanguageOutputSchema = z.object({
  enhancedText: z
    .string()
    .describe('The enhanced text with improved language and professionalism.'),
});
export type EnhanceResumeLanguageOutput = z.infer<typeof EnhanceResumeLanguageOutputSchema>;

export async function enhanceResumeLanguage(input: EnhanceResumeLanguageInput): Promise<EnhanceResumeLanguageOutput> {
  return enhanceResumeLanguageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceResumeLanguagePrompt',
  input: {schema: EnhanceResumeLanguageInputSchema},
  output: {schema: EnhanceResumeLanguageOutputSchema},
  prompt: `You are an AI assistant specialized in enhancing resume language for professionalism and impact.

  Please review the following text from a resume section and suggest improvements to the language, focusing on rephrasing bullet points and summary statements to be more compelling and professional.

  Respond in {{language}}.

  Original Text (in any language, but your response must be in {{language}}): {{{sectionText}}}

  Enhanced Text (in {{language}}):`,
});

const enhanceResumeLanguageFlow = ai.defineFlow(
  {
    name: 'enhanceResumeLanguageFlow',
    inputSchema: EnhanceResumeLanguageInputSchema,
    outputSchema: EnhanceResumeLanguageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
