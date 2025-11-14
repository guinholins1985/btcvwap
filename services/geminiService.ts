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

  // --- Dynamic Buy Order based on Weekly VWAP ---
  const buyPrice = vwap.weekly.current * 0.998; // Entry slightly below weekly VWAP for a dip buy
  const buyStopLoss = buyPrice * 0.99;         // 1% stop loss
  const buyTakeProfit = buyPrice * 1.025;      // 2.5% take profit

  const buyOrder: SuggestedOrder = {
    type: "Buy Limit",
    price: parseFloat(buyPrice.toFixed(3)),
    takeProfit: parseFloat(buyTakeProfit.toFixed(3)),
    stopLoss: parseFloat(buyStopLoss.toFixed(3)),
    reason: "Ordem posicionada em zona de alta liquidez, antecipando um reteste e suporte na VWAP Semanal. Risco/Retorno atrativo."
  };

  // --- Dynamic Sell Order based on Monthly VWAP ---
  const sellPrice = vwap.monthly.current * 1.002; // Entry slightly above monthly VWAP for a rejection sell
  const sellStopLoss = sellPrice * 1.01;          // 1% stop loss
  const sellTakeProfit = sellPrice * 0.975;       // 2.5% take profit

  const sellOrder: SuggestedOrder = {
    type: "Sell Limit",
    price: parseFloat(sellPrice.toFixed(3)),
    takeProfit: parseFloat(sellTakeProfit.toFixed(3)),
    stopLoss: parseFloat(sellStopLoss.toFixed(3)),
    reason: "Ordem posicionada em forte resistência histórica, confluindo com a VWAP Mensal. Ideal para capturar uma retração."
  };

  const analysis: AnalysisResult = {
    sentiment: "Análise de IA: O preço está em uma faixa de negociação entre as VWAPs semanal e mensal. Sugerimos ordens pendentes em ambos os níveis para capturar os próximos movimentos decisivos.",
    buyOrders: [buyOrder],
    sellOrders: [sellOrder]
  };

  return Promise.resolve(analysis);
};
