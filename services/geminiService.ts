
import { GoogleGenAI, Type } from "@google/genai";
import { StockHolding, DividendInsight, Language } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const fetchStockData = async (ticker: string, purchaseDate: string, lang: Language = 'en'): Promise<Partial<StockHolding> & { currentExchangeRate: number } | null> => {
  const langContext = lang === 'ko' ? "Return the company name in Korean." : "Return the company name in English.";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Fetch current market data for stock ticker: ${ticker}. 
      Also find the USD/KRW exchange rate today AND on ${purchaseDate}. 
      Return dividend details. ${langContext}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            currentPrice: { type: Type.NUMBER },
            dividendPerShare: { type: Type.NUMBER, description: "Annual dividend amount per share in USD" },
            dividendYield: { type: Type.NUMBER, description: "Annual yield percentage (e.g., 3.5)" },
            frequency: { type: Type.STRING, enum: ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'] },
            exchangeRateAtPurchase: { type: Type.NUMBER, description: "USD to KRW exchange rate on the purchase date" },
            currentExchangeRate: { type: Type.NUMBER, description: "Current USD to KRW exchange rate" }
          },
          required: ["name", "currentPrice", "dividendPerShare", "dividendYield", "frequency", "exchangeRateAtPurchase", "currentExchangeRate"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return data;
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return null;
  }
};

export const getPortfolioInsights = async (holdings: StockHolding[], lang: Language = 'en'): Promise<DividendInsight | null> => {
  if (holdings.length === 0) return null;

  const summary = holdings.map(h => `${h.ticker} (${h.shares} shares)`).join(", ");
  const langContext = lang === 'ko' ? "Please provide the summary and growthPotential in Korean language." : "";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this stock portfolio for dividend safety and growth: ${summary}. 
      Provide a friendly summary, a SAFETY SCORE from 1 to 10 (where 10 is extremely safe/stable and 1 is very risky), and growth potential outlook. 
      Ensure the SAFETY SCORE strictly reflects how reliable the dividends are. ${langContext}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            safetyScore: { type: Type.NUMBER, description: "Score from 1 to 10. 10 is most safe, 1 is least safe." },
            growthPotential: { type: Type.STRING }
          },
          required: ["summary", "safetyScore", "growthPotential"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error fetching insights:", error);
    return null;
  }
};

export const getCurrentExchangeRate = async (): Promise<number> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "What is the current USD to KRW exchange rate? Return only the number.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rate: { type: Type.NUMBER }
          },
          required: ["rate"]
        }
      }
    });
    const data = JSON.parse(response.text || "{\"rate\": 1350}");
    return data.rate;
  } catch {
    return 1350;
  }
};
