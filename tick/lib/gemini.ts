import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import { BullBear, SentimentSummary } from './types';

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function generateBullBear(context: any): Promise<BullBear> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Fast and JSON-capable

  const prompt = `Analyze the following context for stock ${context.symbol || 'the provided stock'} and provide a concise bull case (3 points), a bear case (3 points), and a brief analyst summary paragraph.
Context:
${JSON.stringify(context, null, 2)}
  `;

  const schema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
      bull: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
        description: "3 concise bullish points"
      },
      bear: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
        description: "3 concise bearish points"
      },
      analyst: {
        type: SchemaType.STRING,
        description: "1 paragraph summary of the overarching sentiment and outlook"
      }
    },
    required: ["bull", "bear", "analyst"]
  };


  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  return JSON.parse(result.response.text());
}

export async function generateSentimentSummary(posts: any[]): Promise<SentimentSummary> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Analyze these recent Reddit posts about a stock and determine the overall sentiment. 
Return a label (Bullish, Bearish, or Mixed) and 3 short bullet points summarizing the community's main arguments or focus areas.
Posts:
${JSON.stringify(posts, null, 2)}
  `;

  const schema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
      label: {
        type: SchemaType.STRING,
        format: "enum",
        enum: ["Bullish", "Bearish", "Mixed"],
        description: "Overall sentiment label"
      },
      points: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
        description: "3 short bullet points summarizing the community's sentiment"
      }
    },
    required: ["label", "points"]
  };

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  return JSON.parse(result.response.text());
}

export async function generateChatResponse(context: any, question: string): Promise<string> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a helpful financial assistant inside a stock discovery app called Tick.
The user is viewing the stock ${context.symbol || ''} (${context.name || ''}).
Here is the latest data context about the stock:
${JSON.stringify({
  price: context.price,
  changePct: context.changePct,
  pe: context.pe,
  summary: context.summary?.substring(0, 500) // snippet to save tokens
}, null, 2)}

User's Question: ${question}

Answer concisely, accurately, and informatively. Focus on the context provided where relevant. Keep it straight to the point without excessive pleasantries.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

