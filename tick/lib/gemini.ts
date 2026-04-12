import { BullBear, SentimentSummary, CompareData, CompareVerdict } from './types';

const GEMINI_MODEL = "gemini-2.5-flash";

function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  return apiKey;
}

async function geminiGenerate<T>(prompt: string, responseJsonSchema?: Record<string, unknown>): Promise<T | string> {
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

  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
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

export async function generateCompareVerdict(data: CompareData): Promise<CompareVerdict> {
  const { stockA, stockB } = data;

  const fmt = (s: typeof stockA) => `${s.symbol} (${s.name})
- Price: $${s.price.toFixed(2)}, Change: ${s.changePct >= 0 ? '+' : ''}${(s.changePct * 100).toFixed(2)}%
- P/E Ratio: ${s.pe ?? 'N/A'}, Market Cap: ${s.marketCap ? '$' + (s.marketCap / 1e9).toFixed(2) + 'B' : 'N/A'}
- Revenue Growth: ${s.revenueGrowth != null ? (s.revenueGrowth * 100).toFixed(1) + '%' : 'N/A'}
- Earnings Growth: ${s.earningsGrowth != null ? (s.earningsGrowth * 100).toFixed(1) + '%' : 'N/A'}
- Profit Margin: ${s.profitMargin != null ? (s.profitMargin * 100).toFixed(1) + '%' : 'N/A'}
- Debt/Equity: ${s.debtToEquity ?? 'N/A'}
- Beta: ${s.beta ?? 'N/A'}, Dividend Yield: ${s.divYield != null ? (s.divYield * 100).toFixed(2) + '%' : 'N/A'}`;

  const prompt = `Compare these two stocks and determine which is the better investment right now.

Stock A: ${fmt(stockA)}

Stock B: ${fmt(stockB)}

Provide a clear verdict on which stock is better and why. Cover revenue growth comparison, valuation analysis (P/E and relative value), and key risks to consider. Be concise and decisive.`;

  const schema = {
    type: "object",
    properties: {
      winner: {
        type: "string",
        description: "Ticker symbol of the stock you consider the better pick"
      },
      confidence: {
        type: "string",
        enum: ["High", "Medium", "Low"],
        description: "How confident you are in this pick"
      },
      summary: {
        type: "string",
        description: "2-3 sentence overall verdict"
      },
      revenueAnalysis: {
        type: "string",
        description: "1-2 sentence revenue growth comparison"
      },
      valuationAnalysis: {
        type: "string",
        description: "1-2 sentence P/E and valuation comparison"
      },
      risks: {
        type: "string",
        description: "1-2 sentence about key risks to consider"
      }
    },
    required: ["winner", "confidence", "summary", "revenueAnalysis", "valuationAnalysis", "risks"],
    additionalProperties: false,
  };

  return geminiGenerate<CompareVerdict>(prompt, schema) as Promise<CompareVerdict>;
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

Answer concisely, accurately, and informatively. Focus on the context provided where relevant. Keep it straight to the point without excessive pleasantries.`;

  return geminiGenerate<string>(prompt) as Promise<string>;
}
