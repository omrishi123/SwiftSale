'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a unique SKU for a product.
 *
 * The flow uses the product name and category to generate a SKU.
 *
 * @param {string} productName - The name of the product.
 * @param {string} productCategory - The category of the product.
 * @returns {string} A unique SKU generated for the product.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateUniqueSkuInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productCategory: z.string().describe('The category of the product.'),
});
export type GenerateUniqueSkuInput = z.infer<typeof GenerateUniqueSkuInputSchema>;

const GenerateUniqueSkuOutputSchema = z.object({
  sku: z.string().describe('A unique SKU generated for the product.'),
});
export type GenerateUniqueSkuOutput = z.infer<typeof GenerateUniqueSkuOutputSchema>;

export async function generateUniqueSku(input: GenerateUniqueSkuInput): Promise<GenerateUniqueSkuOutput> {
  return generateUniqueSkuFlow(input);
}

const generateUniqueSkuPrompt = ai.definePrompt({
  name: 'generateUniqueSkuPrompt',
  input: {schema: GenerateUniqueSkuInputSchema},
  output: {schema: GenerateUniqueSkuOutputSchema},
  prompt: `You are an expert product SKU generator. You will generate a unique SKU for a product based on its name and category.

Product Name: {{{productName}}}
Product Category: {{{productCategory}}}

Ensure the SKU is unique, alphanumeric, and 13 characters long. Start with category prefix of 3 characters. Use 4 characters from product name and end with 6 random alphanumeric characters.
`,
});

const generateUniqueSkuFlow = ai.defineFlow(
  {
    name: 'generateUniqueSkuFlow',
    inputSchema: GenerateUniqueSkuInputSchema,
    outputSchema: GenerateUniqueSkuOutputSchema,
  },
  async input => {
    const {output} = await generateUniqueSkuPrompt(input);
    return output!;
  }
);
