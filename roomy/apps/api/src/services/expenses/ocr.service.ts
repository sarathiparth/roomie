import axios from 'axios';
import { env } from '../../config/env.js';

export interface OcrItem {
  name: string;
  price: number;
}

export interface OcrResult {
  items: OcrItem[];
  rawText: string;
  total?: number;
}

/**
 * Send image buffer to Google Cloud Vision API for text extraction,
 * then parse line items from the detected text.
 * Free tier: 1000 units/month
 */
export async function extractBillItems(imageBase64: string): Promise<OcrResult> {
  if (!env.GOOGLE_VISION_API_KEY) {
    return { items: [], rawText: '', total: undefined };
  }

  const url = `https://vision.googleapis.com/v1/images:annotate?key=${env.GOOGLE_VISION_API_KEY}`;
  const body = {
    requests: [{
      image: { content: imageBase64 },
      features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
    }],
  };

  const response = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
  });

  const textAnnotations = response.data?.responses?.[0]?.textAnnotations;
  if (!textAnnotations?.length) return { items: [], rawText: '' };

  const rawText: string = textAnnotations[0].description ?? '';
  const items = parseLineItems(rawText);
  const total = extractTotal(rawText);

  return { items, rawText, total };
}

/**
 * Parse common Indian bill formats (Blinkit, Zepto, Swiggy Instamart, restaurants).
 * Strategy: find lines with a number at the end (price), take preceding text as item name.
 */
function parseLineItems(text: string): OcrItem[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const items: OcrItem[] = [];

  // Pattern: "Item Name   ₹123" or "Item Name   123.00" or "Item Name   123"
  const pricePattern = /^(.+?)\s+[₹Rs.]?\s*(\d+(?:\.\d{1,2})?)$/;
  // Exclude totals/tax/delivery
  const skipWords = /^(total|subtotal|gst|tax|delivery|discount|saved|charges|convenience|amount|bill|invoice|order|date|time|address|phone|items?)\b/i;

  for (const line of lines) {
    const match = pricePattern.exec(line);
    if (!match) continue;

    const name = match[1].trim();
    const price = parseFloat(match[2]);

    if (skipWords.test(name)) continue;
    if (name.length < 2 || price <= 0 || price > 50000) continue;

    items.push({ name, price });
  }

  return items;
}

function extractTotal(text: string): number | undefined {
  // Look for "Total: 450" or "TOTAL  450.00" patterns
  const totalPattern = /(?:grand\s+)?total[:\s]+[₹Rs.]?\s*(\d+(?:\.\d{1,2})?)/i;
  const match = totalPattern.exec(text);
  return match ? parseFloat(match[1]) : undefined;
}
