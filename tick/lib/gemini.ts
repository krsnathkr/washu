import { BullBear, SentimentSummary } from './types';

const GEMINI_MODEL = "gemini-2.5-flash";

function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  return apiKey;
}

async function geminiGenerate<T>(prompt: string, responseJsonSchema?: Record<string, unknown>, tools?: Record<string, unknown>[]): Promise<T | string> {
  const apiKey = getApiKey();
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: responseJsonSchema
          ? {
              responseMimeType: "application/json",
              responseJsonSchema,
            }
          : undefined,
        ...(tools && { tools }),
      }),
    }
  );

  const payload = await response.json();

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.error?.status ||
      "Gemini API request failed";
    throw new Error(message);
  }

  const parts = payload?.candidates?.[0]?.content?.parts;
  const text = parts
    ?.filter((p: any) => p.text)
    .map((p: any) => p.text)
    .join("") || undefined;
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  if (!responseJsonSchema) {
    return text as string;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Gemini returned invalid JSON");
  }
}

export async function generateBullBear(context: any): Promise<BullBear> {
  const prompt = `Analyze the following context for stock ${context.symbol || 'the provided stock'} and provide a concise bull case (3 points), a bear case (3 points), and a brief analyst summary paragraph.
Context:
${JSON.stringify(context, null, 2)}
  `;

  const schema = {
    type: "object",
    properties: {
      bull: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
        description: "3 concise bullish points"
      },
      bear: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
        description: "3 concise bearish points"
      },
      analyst: {
        type: "string",
        description: "1 paragraph summary of the overarching sentiment and outlook"
      }
    },
    required: ["bull", "bear", "analyst"],
    additionalProperties: false,
  };

  return geminiGenerate<BullBear>(prompt, schema) as Promise<BullBear>;
}

export async function generateSentimentSummary(posts: any[]): Promise<SentimentSummary> {
  const prompt = `Analyze these recent Reddit posts about a stock and determine the overall sentiment. 
Return a label (Bullish, Bearish, or Mixed) and 3 short bullet points summarizing the community's main arguments or focus areas.
Posts:
${JSON.stringify(posts, null, 2)}
  `;

  const schema = {
    type: "object",
    properties: {
      label: {
        type: "string",
        enum: ["Bullish", "Bearish", "Mixed"],
        description: "Overall sentiment label"
      },
      points: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
        description: "3 short bullet points summarizing the community's sentiment"
      }
    },
    required: ["label", "points"],
    additionalProperties: false,
  };

  return geminiGenerate<SentimentSummary>(prompt, schema) as Promise<SentimentSummary>;
}

export async function generateChatResponse(context: any, question: string): Promise<string> {
  const stats = typeof context.stats === "string"
    ? (() => {
        try {
          return JSON.parse(context.stats);
        } catch {
          return {};
        }
      })()
    : context.stats ?? {};

  const prompt = `You are a helpful financial assistant inside a stock discovery app called Tick.
The user is viewing the stock ${context.symbol || ''} (${context.name || ''}).
Here is the latest data context about the stock:
${JSON.stringify({
  price: context.price ?? stats.price,
  changePct: context.changePct ?? stats.changePct,
  pe: context.pe ?? stats.pe,
  marketCap: context.marketCap ?? stats.marketCap,
  summary: (context.summary ?? stats.summary ?? "").substring(0, 500)
}, null, 2)}

User's Question: ${question}

Answer concisely, accurately, and informatively. Use the stock data above and web search results where relevant. Keep it straight to the point without excessive pleasantries.`;

  return geminiGenerate<string>(prompt, undefined, [{ googleSearch: {} }]) as Promise<string>;
}
