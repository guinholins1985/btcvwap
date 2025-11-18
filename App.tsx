import React, { useState, useEffect, useCallback } from 'react';
import { fetchMarketData, fetchCurrentPrice, fetchUsdBrlRate } from './services/dataService';
import { calculateRSI, calculateHeikinAshi, calculateVwap, calculatePivotPoints, calculateFibonacciLevels, calculateEMA, calculateEMASeries } from './services/indicatorService';
import { getTradingAnalysis } from './services/geminiService';
import type { Candle, SignalDetails, Signal, AnalysisResult, IndicatorValues, IndicatorSeries } from './types';
import Header from './components/Header';
import SignalCard from './components/PriceDisplay';
import KeyLevelsCard from './components/VwapSignals';
import RiskCalculatorCard from './components/AnalysisPanel';
import QualitativeAnalysisCard from './components/PriceChart';

const App: React.FC = () => {
  const [marketData, setMarketData] = useState<Candle[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [usdBrlRate, setUsdBrlRate] = useState<number>(0);
  const [signalDetails, setSignalDetails] = useState<SignalDetails | null>(null);
  const [indicators, setIndicators] = useState<IndicatorValues | null>(null);
  const [indicatorSeries, setIndicatorSeries] = useState<IndicatorSeries | null>(null);

  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [geminiAnalysis, setGeminiAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState<boolean>(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const generateSignal = useCallback((price: number, data: Candle[]) => {
      if (data.length < 200) return; // Ensure enough data for all indicators

      // --- Calculate Indicators ---
      const rsi = calculateRSI(data, 14);
      const ema50 = calculateEMA(data, 50);
      const ema200 = calculateEMA(data, 200);
      const heikinAshiCandles = calculateHeikinAshi(data);
      const lastHaCandle = heikinAshiCandles.length > 0 ? heikinAshiCandles[heikinAshiCandles.length - 1] : null;
      
      const lastCandleTime = new Date(data[data.length - 1].date);
      const yesterday = new Date(lastCandleTime);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const startOfYesterday = new Date(yesterday);
      startOfYesterday.setUTCHours(0, 0, 0, 0);
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setUTCHours(23, 59, 59, 999);
      const prevDayCandles = data.filter(c => new Date(c.date) >= startOfYesterday && new Date(c.date) <= endOfYesterday);
      let pivots = prevDayCandles.length > 0 ? calculatePivotPoints({ high: Math.max(...prevDayCandles.map(c => c.high)), low: Math.min(...prevDayCandles.map(c => c.low)), close: prevDayCandles[prevDayCandles.length - 1].close, open: 0, date: '', volume: 0 }) : null;
      
      const fibonacci = calculateFibonacciLevels(data);
      
      const now = new Date(data[data.length - 1].date);
      now.setHours(23, 59, 59, 999);
      const oneDayAgo = new Date(now.getTime()); oneDayAgo.setDate(now.getDate() - 1);
      const oneWeekAgo = new Date(now.getTime()); oneWeekAgo.setDate(now.getDate() - 7);
      const oneMonthAgo = new Date(now.getTime()); oneMonthAgo.setMonth(now.getMonth() - 1);
      const oneYearAgo = new Date(now.getTime()); oneYearAgo.setFullYear(now.getFullYear() - 1);
      const twoDaysAgo = new Date(oneDayAgo.getTime()); twoDaysAgo.setDate(oneDayAgo.getDate() - 1);
      const twoWeeksAgo = new Date(oneWeekAgo.getTime()); twoWeeksAgo.setDate(oneWeekAgo.getDate() - 7);
      const twoMonthsAgo = new Date(oneMonthAgo.getTime()); twoMonthsAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const twoYearsAgo = new Date(oneYearAgo.getTime()); twoYearsAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const vwap = {
        daily: { current: calculateVwap(data, oneDayAgo, now), previous: calculateVwap(data, twoDaysAgo, oneDayAgo) },
        weekly: { current: calculateVwap(data, oneWeekAgo, now), previous: calculateVwap(data, twoWeeksAgo, oneWeekAgo) },
        monthly: { current: calculateVwap(data, oneMonthAgo, now), previous: calculateVwap(data, twoMonthsAgo, oneMonthAgo) },
        annual: { current: calculateVwap(data, oneYearAgo, now), previous: calculateVwap(data, twoYearsAgo, oneYearAgo) },
      };

      setIndicators({ rsi, haCandle: lastHaCandle, pivots, vwap, fibonacci, ema50, ema200 });

      // --- New Signal Logic Hierarchy ---
      let signal: Signal = 'MANTER';
      const reasons: string[] = [];
      let signalSet = false;

      const isUptrend = price > ema200;
      const isDowntrend = price < ema200;

      // 1. Confluence Strategy (Highest Priority)
      if (isUptrend && rsi <= 30 && lastHaCandle?.isGreen) {
          signal = 'COMPRA';
          reasons.push(`Tendência de alta (Preço > EMA 200)`);
          reasons.push(`Pullback confirmado com RSI em sobrevenda (≤ 30)`);
          if (Math.abs(price - ema50) / ema50 < 0.01) {
              reasons.push(`Preço próximo da EMA 50, potencial zona de suporte.`);
          }
          signalSet = true;
      } else if (isDowntrend && rsi >= 70 && !lastHaCandle?.isGreen) {
          signal = 'VENDA';
          reasons.push(`Tendência de baixa (Preço < EMA 200)`);
          reasons.push(`Pullback confirmado com RSI em sobrecompra (≥ 70)`);
           if (Math.abs(price - ema50) / ema50 < 0.01) {
              reasons.push(`Preço próximo da EMA 50, potencial zona de resistência.`);
          }
          signalSet = true;
      }

      // 2. Fallback to Breakout Logic
      if (!signalSet && pivots) {
          const prevCandle = data[data.length - 2];
          if (prevCandle && prevCandle.close < pivots.r1 && price >= pivots.r1) {
              signal = 'ROMPIMENTO';
              reasons.push(`Rompimento de alta acima da Resistência R1 ($${pivots.r1.toFixed(3)})`);
              signalSet = true;
          } else if (prevCandle && prevCandle.close > pivots.s1 && price <= pivots.s1) {
              signal = 'ROMPIMENTO';
              reasons.push(`Rompimento de baixa abaixo do Suporte S1 ($${pivots.s1.toFixed(3)})`);
              signalSet = true;
          }
      }

      // 3. Determine Neutral or final fallback state
      if (!signalSet && rsi > 45 && rsi < 55) {
          signal = 'NEUTRO';
          reasons.push("Mercado sem tendência definida (RSI H1 próximo de 50)");
      } else if (!signalSet) {
          signal = 'MANTER';
          reasons.push("Aguardando um sinal de confluência claro.");
      }

      // --- General Confluence Checks (add reasons without changing the signal) ---
      if (isUptrend) reasons.push("Preço acima da EMA 200 (Macro Bullish)");
      else if (isDowntrend) reasons.push("Preço abaixo da EMA 200 (Macro Bearish)");
      
      if (price > ema50) reasons.push("Preço acima da EMA 50 (Força no curto prazo)");
      else reasons.push("Preço abaixo da EMA 50 (Fraqueza no curto prazo)");
      
      if (vwap.weekly.current > 0 && price > vwap.weekly.current) reasons.push("Preço acima da VWAP Semanal (Tendência de alta)");
      if (vwap.weekly.current > 0 && price < vwap.weekly.current) reasons.push("Preço abaixo da VWAP Semanal (Tendência de baixa)");
      
      if (pivots && price > pivots.pivot) reasons.push("Preço acima do Pivot Point Diário");
      if (pivots && price < pivots.pivot) reasons.push("Preço abaixo do Pivot Point Diário");

      const entry = price;
      const stopLoss = signal === 'COMPRA' ? entry * 0.95 : entry * 1.05;
      const takeProfit = signal === 'COMPRA' ? entry * 1.15 : entry * 0.85;

      setSignalDetails({ signal, entry, stopLoss, takeProfit, reasons: [...new Set(reasons)] });

  }, []);

  // Effect for initial historical data load & signal generation
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsDataLoading(true);
        setDataError(null);
        const rate = await fetchUsdBrlRate();
        setUsdBrlRate(rate);

        const data = await fetchMarketData(400); // Fetch more data for accurate VWAP
        setMarketData(data);

        const ema50Series = calculateEMASeries(data, 50);
        const ema200Series = calculateEMASeries(data, 200);
        setIndicatorSeries({ ema50: ema50Series, ema200: ema200Series });

        if (data.length > 0) {
          const latestPrice = data[data.length - 1].close;
          setCurrentPrice(latestPrice);
          generateSignal(latestPrice, data);
        }
      } catch (err) {
        console.error(err);
        setDataError('Não foi possível carregar os dados de mercado. Por favor, atualize a página para tentar novamente.');
      } finally {
        setIsDataLoading(false);
      }
    };
    
    loadData();
  }, [generateSignal]);
  
  // Effect for fetching live price updates and moving the chart
  useEffect(() => {
    if (isDataLoading) return;

    const intervalId = setInterval(async () => {
      try {
        const price = await fetchCurrentPrice();
        setCurrentPrice(price);
        
        setMarketData(prevData => {
            if (prevData.length === 0) return [];
            const newData = [...prevData];
            const lastCandle = { ...newData[newData.length - 1] };
            lastCandle.close = price;
            lastCandle.high = Math.max(lastCandle.high, price);
            lastCandle.low = Math.min(lastCandle.low, price);
            newData[newData.length - 1] = lastCandle;
            
            generateSignal(price, newData);
            
            return newData;
        });

      } catch (error) {
        console.warn("Could not update live price:", error);
      }
    }, 10000); // Fetch every 10 seconds

    return () => clearInterval(intervalId);
  }, [isDataLoading, generateSignal]);

  // Effect for Gemini Analysis
  useEffect(() => {
    const performAnalysis = async () => {
      if (indicators?.vwap && currentPrice > 0) {
        try {
          setIsAnalysisLoading(true);
          setAnalysisError(null);
          const analysis = await getTradingAnalysis(indicators?.vwap ?? null);
          setGeminiAnalysis(analysis);
        } catch (err) {
          console.error("Gemini analysis failed:", err);
          setAnalysisError("Não foi possível obter a análise da IA.");
        } finally {
          setIsAnalysisLoading(false);
        }
      }
    };
    performAnalysis();
  }, [indicators, currentPrice]);


  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-bunker flex flex-col justify-center items-center">
        <div className="flex justify-center items-center space-x-2">
            <div className="w-8 h-8 rounded-full animate-pulse bg-cyan-accent"></div>
            <div className="w-8 h-8 rounded-full animate-pulse bg-cyan-accent delay-200"></div>
            <div className="w-8 h-8 rounded-full animate-pulse bg-cyan-accent delay-400"></div>
        </div>
        <p className="text-spindle mt-4 text-lg">Analisando confluências de mercado...</p>
      </div>
    );
  }
  
  if (dataError) {
    return (
       <div className="min-h-screen bg-bunker flex flex-col justify-center items-center text-center p-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-accent mb-4"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <h1 className="text-2xl font-bold text-white mb-2">Ocorreu um Erro</h1>
        <p className="text-nevada">{dataError}</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-bunker font-sans">
      <Header />
      <main className="container mx-auto p-2 sm:p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-1 flex flex-col gap-4 md:gap-6">
            <SignalCard signalDetails={signalDetails} currentPrice={currentPrice} />
            <KeyLevelsCard 
              pivots={indicators?.pivots ?? null} 
              vwap={indicators?.vwap ?? null} 
              currentPrice={currentPrice} 
              fibonacci={indicators?.fibonacci ?? null}
              ema50={indicators?.ema50 ?? 0}
              ema200={indicators?.ema200 ?? 0}
            />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 flex flex-col gap-4 md:gap-6">
            <QualitativeAnalysisCard
              geminiAnalysis={geminiAnalysis}
              isAnalysisLoading={isAnalysisLoading}
              marketData={marketData}
              vwap={indicators?.vwap}
              signalDetails={signalDetails}
              fibonacci={indicators?.fibonacci}
              indicatorSeries={indicatorSeries}
            />
            <RiskCalculatorCard 
              signalDetails={signalDetails} 
              geminiAnalysis={geminiAnalysis}
              isAnalysisLoading={isAnalysisLoading}
              usdBrlRate={usdBrlRate}
            />
          </div>

        </div>
        <footer className="text-center text-nevada mt-12 text-sm">
          <p>Aviso: Os dados de mercado são simulados com base em referências do Investing.com. As análises não constituem aconselhamento financeiro.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;