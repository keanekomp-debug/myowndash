
import { GoogleGenAI, Type } from "@google/genai";
import { StockMetric, StockAnalysis, NewsItem, PriorityStock } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Fetches market insights specifically citing high-profile institutional sources and 30-year track records.
 */
export async function getInstitutionalInsights() {
  const prompt = `Perform a high-precision global equity scan. Identify the top 5 'Mission Critical' priority stocks in G7, OECD, and Emerging Markets (India, Brazil, Mexico, Chile, Peru).
  
  CRITICAL: You MUST evaluate these based on the overlapping high-conviction strategies of:
  - Lyn Alden (Macro structure/Commodity cycles)
  - Stanley Druckenmiller (Secular growth/Liquidity)
  - Michael Burry (Deep value/Contrarian plays)
  - David Rubenstein (PE Moats/Institutional stability)
  - Vanguard/Bogleheads (Low-cost quality/Diversification)
  - Stanley B. Resor/Mutual Fund Observer (Long-term track records)
  - Polymarket (Prediction market sentiment)
  - WallStreetBets/Bogleheads (Retail flow and fundamental bedrock)
  
  Format the response as a JSON object with:
  1. "marketSummary": A precise overview of global macro risks and opportunities.
  2. "priorityStocks": Array of 5 stocks with ticker, name, country, 'recommendedBy' (citing specific names from the list above), and 'thesisSnippet'.
  3. "newsFeed": Array of 5 news items with headline, source (Bloomberg, WSJ, FT, or Yahoo Finance ONLY), url, and time.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            marketSummary: { type: Type.STRING },
            priorityStocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ticker: { type: Type.STRING },
                  name: { type: Type.STRING },
                  country: { type: Type.STRING },
                  recommendedBy: { type: Type.ARRAY, items: { type: Type.STRING } },
                  thesisSnippet: { type: Type.STRING }
                },
                required: ['ticker', 'name', 'country', 'recommendedBy', 'thesisSnippet']
              }
            },
            newsFeed: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  headline: { type: Type.STRING },
                  source: { type: Type.STRING },
                  url: { type: Type.STRING },
                  time: { type: Type.STRING }
                },
                required: ['headline', 'source', 'url', 'time']
              }
            }
          },
          required: ['marketSummary', 'priorityStocks', 'newsFeed']
        }
      },
    });
    
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error fetching institutional insights:", error);
    return null;
  }
}

/**
 * Generates a detailed stock analysis report with 30-year perspective.
 */
export async function analyzeStock(stock: StockMetric): Promise<StockAnalysis> {
  const prompt = `Quant Analyst Report: ${stock.name} (${stock.ticker})
  Analyze using 30 years of historical context.
  Metrics: P/E: ${stock.peRatio}, ROE: ${stock.roe}%, ROIC: ${stock.roic}%, FCF Yield: ${stock.fcfYield}%.
  
  Output Requirements:
  1. Summary of 30yr fundamental stability.
  2. Valuation rating.
  3. Risk score (1-10).
  4. Thesis points.
  5. Primary Risk Factors.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            valuation: { type: Type.STRING, enum: ['Under', 'Fair', 'Over'] },
            riskScore: { type: Type.NUMBER },
            investmentThesis: { type: Type.ARRAY, items: { type: Type.STRING } },
            risks: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['summary', 'valuation', 'riskScore', 'investmentThesis', 'risks']
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    return {
      summary: "Data sync error. Check local connection.",
      valuation: "Fair",
      riskScore: 5,
      investmentThesis: ["Reliable historical floor"],
      risks: ["Connectivity issues"]
    };
  }
}

export function generateHistoricalData(startPrice: number, points: number = 30): any[] {
  const data = [];
  let currentPrice = startPrice;
  const now = new Date();
  for (let i = points; i >= 0; i--) {
    const date = new Date(now);
    date.setFullYear(now.getFullYear() - i);
    const changePercent = (Math.random() - 0.40) * 0.12; 
    currentPrice = currentPrice * (1 + changePercent);
    data.push({ year: date.getFullYear().toString(), price: parseFloat(currentPrice.toFixed(2)) });
  }
  return data;
}
