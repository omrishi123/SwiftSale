'use server';

import { generateUniqueSku } from '@/ai/flows/generate-unique-sku';

export async function generateSkuAction(productName: string, productCategory: string): Promise<string> {
  if (!productName || !productCategory) {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PROD-${randomPart}`;
  }

  try {
    const { sku } = await generateUniqueSku({ productName, productCategory });
    return sku;
  } catch (e) {
    console.error("AI SKU Generation Error:", e);
    // Fallback to a simpler generation method
    const categoryPrefix = productCategory.substring(0, 3).toUpperCase().padEnd(3, 'X');
    const namePart = productName.replace(/\s+/g, '').substring(0, 4).toUpperCase().padEnd(4, 'X');
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${categoryPrefix}${namePart}${randomPart}`.substring(0, 13);
  }
}
