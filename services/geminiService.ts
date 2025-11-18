import type { AnalysisResult, VwapData, SuggestedOrder } from '../types';

/**
 * Generates a dynamic, high-quality mock trading analysis based on VWAP levels.
 * This function is async to maintain the same signature as a real API call.
 * @param vwap The current VWAP data.
 */
export const getTradingAnalysis = async (vwap: VwapData | null): Promise<AnalysisResult> => {
  if (!vwap || !vwap.weekly?.current || !vwap.monthly?.current) {
    return {
      sentiment: "Aguardando dados de VWAP para gerar análise de IA.",
      buyOrders: [],
      sellOrders: [],
    };
  }

  // --- VWAP Semanal (Weekly) ---
  const weeklyVwap = vwap.weekly.current;
  // LOW Entry (Buy Limit)
  const buyWeeklyPrice = weeklyVwap * 0.998;
  const buyWeeklySL = buyWeeklyPrice * 0.99;
  const buyWeeklyTP = buyWeeklyPrice * 1.025;
  const buyWeeklyOrder: SuggestedOrder = {
    type: "Buy Limit (VWAP Semanal LOW)",
    price: parseFloat(buyWeeklyPrice.toFixed(3)),
    takeProfit: parseFloat(buyWeeklyTP.toFixed(3)),
    stopLoss: parseFloat(buyWeeklySL.toFixed(3)),
    reason: "Ponto de entrada em suporte potencial ligeiramente abaixo da VWAP Semanal."
  };

  // HIGH Entry (Sell Limit)
  const sellWeeklyPrice = weeklyVwap * 1.002;
  const sellWeeklySL = sellWeeklyPrice * 1.01;
  const sellWeeklyTP = sellWeeklyPrice * 0.975;
  const sellWeeklyOrder: SuggestedOrder = {
    type: "Sell Limit (VWAP Semanal HIGH)",
    price: parseFloat(sellWeeklyPrice.toFixed(3)),
    takeProfit: parseFloat(sellWeeklyTP.toFixed(3)),
    stopLoss: parseFloat(sellWeeklySL.toFixed(3)),
    reason: "Ponto de entrada em resistência potencial ligeiramente acima da VWAP Semanal."
  };
  
  // --- VWAP Mensal (Monthly) ---
  const monthlyVwap = vwap.monthly.current;
  // LOW Entry (Buy Limit)
  const buyMonthlyPrice = monthlyVwap * 0.995;
  const buyMonthlySL = buyMonthlyPrice * 0.99;
  const buyMonthlyTP = buyMonthlyPrice * 1.03; // Higher R:R for stronger level
  const buyMonthlyOrder: SuggestedOrder = {
    type: "Buy Limit (VWAP Mensal LOW)",
    price: parseFloat(buyMonthlyPrice.toFixed(3)),
    takeProfit: parseFloat(buyMonthlyTP.toFixed(3)),
    stopLoss: parseFloat(buyMonthlySL.toFixed(3)),
    reason: "Ponto de entrada em suporte principal, buscando uma reversão na VWAP Mensal."
  };

  // HIGH Entry (Sell Limit)
  const sellMonthlyPrice = monthlyVwap * 1.005;
  const sellMonthlySL = sellMonthlyPrice * 1.01;
  const sellMonthlyTP = sellMonthlyPrice * 0.97; // Higher R:R for stronger level
  const sellMonthlyOrder: SuggestedOrder = {
    type: "Sell Limit (VWAP Mensal HIGH)",
    price: parseFloat(sellMonthlyPrice.toFixed(3)),
    takeProfit: parseFloat(sellMonthlyTP.toFixed(3)),
    stopLoss: parseFloat(sellMonthlySL.toFixed(3)),
    reason: "Ponto de entrada em resistência principal, antecipando uma rejeição na VWAP Mensal."
  };

  const analysis: AnalysisResult = {
    sentiment: "A IA sugere monitorar as VWAPs semanal e mensal. Foram identificados pontos de entrada potenciais para compra (suporte LOW) e venda (resistência HIGH) em ambos os níveis, permitindo estratégias de reversão.",
    buyOrders: [buyWeeklyOrder, buyMonthlyOrder].sort((a,b) => a.price - b.price),
    sellOrders: [sellWeeklyOrder, sellMonthlyOrder].sort((a,b) => a.price - b.price)
  };

  return Promise.resolve(analysis);
};