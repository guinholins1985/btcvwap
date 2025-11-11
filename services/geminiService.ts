import type { AnalysisResult } from '../types';

// Mock data to be used as a self-contained source of AI analysis.
const mockAnalysis: AnalysisResult = {
  sentiment: "Análise de IA autônoma. O sentimento atual sugere cautela, com o preço consolidado entre os níveis de VWAP semanal e mensal, indicando uma possível indecisão do mercado a curto prazo.",
  buyOrders: [
    {
      type: "Buy Limit",
      price: 102800.00,
      takeProfit: 104500.00,
      stopLoss: 101950.00,
      reason: "Posicionado em um nível de suporte chave, próximo da VWAP Semanal, aguardando um reteste para uma entrada de baixo risco."
    }
  ],
  sellOrders: [
     {
      type: "Sell Limit",
      price: 105500.00,
      takeProfit: 104100.00,
      stopLoss: 106200.00,
      reason: "Posicionado em uma resistência importante, perto da VWAP Mensal, antecipando uma possível rejeição do preço nesse nível."
    }
  ]
};

/**
 * Returns a static, high-quality mock trading analysis.
 * This function is async to maintain the same signature as the original API call.
 */
export const getTradingAnalysis = async (): Promise<AnalysisResult> => {
  // Returns the mock analysis immediately, wrapped in a resolved promise.
  return Promise.resolve(mockAnalysis);
};