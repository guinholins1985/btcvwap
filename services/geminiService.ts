
import { GoogleGenAI, Type } from "@google/genai";
import type { VwapData, AnalysisResult } from '../types';

// FIX: Initialize GoogleGenAI directly with process.env.API_KEY as per coding guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    sentiment: {
      type: Type.STRING,
      description: 'Análise de sentimento de mercado (ex: "Otimista", "Pessimista", "Neutro") com uma breve explicação.'
    },
    buyOrders: {
      type: Type.ARRAY,
      description: 'Uma lista de até duas ordens de compra pendentes sugeridas.',
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: 'Tipo da ordem (ex: "Buy Limit", "Buy Stop").' },
          price: { type: Type.NUMBER, description: 'Preço de entrada sugerido.' },
          takeProfit: { type: Type.NUMBER, description: 'Preço alvo para realização de lucro (Take Profit), baseado no próximo nível de VWAP ou pivot.'},
          reason: { type: Type.STRING, description: 'Breve justificativa técnica para a ordem.' }
        },
        required: ['type', 'price', 'takeProfit', 'reason']
      }
    },
    sellOrders: {
      type: Type.ARRAY,
      description: 'Uma lista de até duas ordens de venda pendentes sugeridas.',
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: 'Tipo da ordem (ex: "Sell Limit", "Sell Stop").' },
          price: { type: Type.NUMBER, description: 'Preço de entrada sugerido.' },
          takeProfit: { type: Type.NUMBER, description: 'Preço alvo para realização de lucro (Take Profit), baseado no próximo nível de VWAP ou pivot.'},
          reason: { type: Type.STRING, description: 'Breve justificativa técnica para a ordem.' }
        },
        required: ['type', 'price', 'takeProfit', 'reason']
      }
    }
  },
  required: ['sentiment', 'buyOrders', 'sellOrders']
};


export const getTradingAnalysis = async (currentPrice: number, vwap: VwapData): Promise<AnalysisResult> => {
  const prompt = `
O preço atual do BTC/USD é ${currentPrice.toFixed(2)}.
Os níveis de VWAP são:
- VWAP Semanal: ${vwap.weekly.toFixed(2)}
- VWAP Mensal: ${vwap.monthly.toFixed(2)}
- VWAP Anual: ${vwap.annual.toFixed(2)}

Com base nesses níveis, que atuam como suporte e resistência dinâmicos, forneça uma breve análise de sentimento e sugira até duas ordens de compra pendentes e até duas ordens de venda pendentes. Para cada ordem, especifique o tipo (ex: Buy Limit, Sell Stop), o preço de entrada, um alvo de take profit realista (baseado no próximo nível chave de preço) e uma breve justificativa técnica.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: "Você é um analista financeiro especialista em criptomoedas, focado em análise técnica. Sua tarefa é analisar os níveis de VWAP (Preço Médio Ponderado por Volume) para o par BTC/USD e sugerir ordens pendentes com base nesses dados. Seja conciso e direto.",
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
    },
  });

  const jsonText = response.text.trim();
  try {
    return JSON.parse(jsonText) as AnalysisResult;
  } catch (e) {
    console.error("Failed to parse Gemini response:", jsonText, e);
    throw new Error("A resposta da IA não estava no formato JSON esperado.");
  }
};