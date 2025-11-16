import React, { useState, useEffect, useCallback } from 'react';
import { fetchMarketData, fetchCurrentPrice, fetchUsdBrlRate } from './services/dataService';
import { calculateRSI, calculateHeikinAshi, calculateVwap, calculatePivotPoints, calculateFibonacciLevels } from './services/indicatorService';
import { getTradingAnalysis } from './services/geminiService';
import type { Candle, VwapData, PivotPoints, SignalDetails, HeikinAshiCandle, Signal, AnalysisResult, FibonacciLevels } from './types';
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
  const [indicators, setIndicators] = useState<{
    rsi: number;
    haCandle: HeikinAshiCandle | null;
    pivots: PivotPoints | null;
    vwap: VwapData | null;
    fibonacci: FibonacciLevels | null;
  } | null>(null);

  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [geminiAnalysis, setGeminiAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState<boolean>(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const generateSignal = useCallback((price: number, data: Candle[]) => {
      if (data.length < 2) return;

      const prevCandle = data[data.length - 2];
      const prevPrice = prevCandle.close;

      // Calculate Indicators
      const rsi = calculateRSI(data);
      const heikinAshiCandles = calculateHeikinAshi(data);
      const lastHaCandle = heikinAshiCandles.length > 0 ? heikinAshiCandles[heikinAshiCandles.length - 1] : null;
      
      // --- Pivot Point Calculation for Daily Pivots from H1 data ---
      const lastCandleTime = new Date(data[data.length - 1].date);
      const yesterday = new Date(lastCandleTime);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const startOfYesterday = new Date(yesterday);
      startOfYesterday.setUTCHours(0, 0, 0, 0);
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setUTCHours(23, 59, 59, 999);

      const prevDayCandles = data.filter(c => {
          const candleDate = new Date(c.date);
          return candleDate >= startOfYesterday && candleDate <= endOfYesterday;
      });

      let pivots: PivotPoints | null = null;
      if (prevDayCandles.length > 0) {
          const prevDayHigh = Math.max(...prevDayCandles.map(c => c.high));
          const prevDayLow = Math.min(...prevDayCandles.map(c => c.low));
          const prevDayClose = prevDayCandles[prevDayCandles.length - 1].close;
          const dummyPrevDayCandle: Candle = {
              high: prevDayHigh,
              low: prevDayLow,
              close: prevDayClose,
              open: prevDayCandles[0].open,
              date: prevDayCandles[0].date,
              volume: 0 // Not used in calculation
          };
          pivots = calculatePivotPoints(dummyPrevDayCandle);
      }
      
      const fibonacci = calculateFibonacciLevels(data);
      
      const now = new Date(data[data.length - 1].date);
      now.setHours(23, 59, 59, 999); // End of day for consistent calcs

      // Current periods
      const oneDayAgo = new Date(now.getTime());
      oneDayAgo.setDate(now.getDate() - 1);
      const oneWeekAgo = new Date(now.getTime());
      oneWeekAgo.setDate(now.getDate() - 7);
      const oneMonthAgo = new Date(now.getTime());
      oneMonthAgo.setMonth(now.getMonth() - 1);
      const oneYearAgo = new Date(now.getTime());
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      
      // Previous periods
      const twoDaysAgo = new Date(oneDayAgo.getTime());
      twoDaysAgo.setDate(oneDayAgo.getDate() - 1);
      const twoWeeksAgo = new Date(oneWeekAgo.getTime());
      twoWeeksAgo.setDate(oneWeekAgo.getDate() - 7);
      const twoMonthsAgo = new Date(oneMonthAgo.getTime());
      twoMonthsAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const twoYearsAgo = new Date(oneYearAgo.getTime());
      twoYearsAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const vwap: VwapData = {
        daily: {
          current: calculateVwap(data, oneDayAgo, now),
          previous: calculateVwap(data, twoDaysAgo, oneDayAgo)
        },
        weekly: {
          current: calculateVwap(data, oneWeekAgo, now),
          previous: calculateVwap(data, twoWeeksAgo, oneWeekAgo)
        },
        monthly: {
          current: calculateVwap(data, oneMonthAgo, now),
          previous: calculateVwap(data, twoMonthsAgo, oneMonthAgo)
        },
        annual: {
          current: calculateVwap(data, oneYearAgo, now),
          previous: calculateVwap(data, twoYearsAgo, oneYearAgo)
        },
      };

      setIndicators({ rsi, haCandle: lastHaCandle, pivots, vwap, fibonacci });

      // Signal Logic Hierarchy
      let signal: Signal = 'MANTER';
      const reasons: string[] = [];
      let signalSet = false;

      // 1. Check for Breakouts (Highest Priority)
      if (pivots) {
          if (prevPrice < pivots.r1 && price >= pivots.r1) {
              signal = 'ROMPIMENTO';
              reasons.push(`Rompimento de alta acima da Resistência R1 ($${pivots.r1.toFixed(3)})`);
              signalSet = true;
          } else if (prevPrice > pivots.s1 && price <= pivots.s1) {
              signal = 'ROMPIMENTO';
              reasons.push(`Rompimento de baixa abaixo do Suporte S1 ($${pivots.s1.toFixed(3)})`);
              signalSet = true;
          }
      }

      // 2. Check for Fibonacci Reversals/Bounces
      if (!signalSet && fibonacci && lastHaCandle) {
          const { levels, isUptrend } = fibonacci;
          const fib100 = levels['100%'];
          const fib200 = levels['200%'];
          const isNear = (level: number) => level > 0 && Math.abs(price - level) / level < 0.005;

          // Reversal at 200% Extension (Exhaustion)
          if (isUptrend && isNear(fib200) && !lastHaCandle.isGreen && rsi > 68) {
               signal = 'VENDA';
               reasons.push(`Exaustão de alta perto da Extensão Fibonacci 200% em $${fib200.toFixed(3)}.`);
               signalSet = true;
          } else if (!isUptrend && isNear(fib200) && lastHaCandle.isGreen && rsi < 32) {
               signal = 'COMPRA';
               reasons.push(`Exaustão de baixa perto da Extensão Fibonacci 200% em $${fib200.toFixed(3)}.`);
               signalSet = true;
          }

          // Bounce at 100% Retracement (Swing Point Retest)
          if (!signalSet) {
              if (isUptrend && isNear(fib100) && lastHaCandle.isGreen && price > fib100) {
                  signal = 'COMPRA';
                  reasons.push(`Teste e rejeição do Fundo do Swing (Fibonacci 100%) em $${fib100.toFixed(3)}.`);
                  signalSet = true;
              } else if (!isUptrend && isNear(fib100) && !lastHaCandle.isGreen && price < fib100) {
                  signal = 'VENDA';
                  reasons.push(`Teste e rejeição do Topo do Swing (Fibonacci 100%) em $${fib100.toFixed(3)}.`);
                  signalSet = true;
              }
          }
      }

      // 3. Check for strong RSI + Heikin-Ashi signals
      if (!signalSet && lastHaCandle) {
          if (rsi <= 30 && lastHaCandle.isGreen) {
              signal = 'COMPRA';
              reasons.push("RSI(15) Horário (H1) em sobrevenda (≤ 30)");
              reasons.push("Candle Heikin-Ashi Verde (Confirmação H1)");
              signalSet = true;
          } else if (rsi >= 70 && !lastHaCandle.isGreen) {
              signal = 'VENDA';
              reasons.push("RSI(15) Horário (H1) em sobrecompra (≥ 70)");
              reasons.push("Candle Heikin-Ashi Vermelho (Confirmação H1)");
              signalSet = true;
          }
      }
      
      // 4. Check for VWAP Retracements
      if (!signalSet && lastHaCandle) {
          const isVwapUptrend = price > vwap.weekly.current;
          const isVwapDowntrend = price < vwap.weekly.current;

          if (isVwapUptrend && !lastHaCandle.isGreen && price > vwap.daily.current) {
              signal = 'RETRAÇÃO';
              reasons.push("Retração em tendência de alta (acima da VWAP Semanal)");
              signalSet = true;
          } else if (isVwapDowntrend && lastHaCandle.isGreen && price < vwap.daily.current) {
              signal = 'RETRAÇÃO';
              reasons.push("Retração em tendência de baixa (abaixo da VWAP Semanal)");
              signalSet = true;
          }
      }
      
      // 5. Determine Neutral or final fallback state
      if (!signalSet && rsi > 45 && rsi < 55) {
          signal = 'NEUTRO';
          reasons.push("Mercado sem tendência definida (RSI H1 próximo de 50)");
      } else if (!signalSet) {
          signal = 'MANTER';
      }

      // Confluence Checks (add reasons without changing the signal)
      if(rsi <= 35 && rsi > 30) reasons.push("RSI(15) Horário (H1) próximo de sobrevenda");
      if(rsi >= 65 && rsi < 70) reasons.push("RSI(15) Horário (H1) próximo de sobrecompra");
      if (vwap.daily.current > 0 && price > vwap.daily.current) reasons.push("Preço acima da VWAP Diária");
      if (vwap.daily.current > 0 && price < vwap.daily.current) reasons.push("Preço abaixo da VWAP Diária");
      if (vwap.weekly.current > 0 && price > vwap.weekly.current) reasons.push("Preço acima da VWAP Semanal (Tendência de alta)");
      if (vwap.weekly.current > 0 && price < vwap.weekly.current) reasons.push("Preço abaixo da VWAP Semanal (Tendência de baixa)");
      if (vwap.annual.current > 0 && price > vwap.annual.current) reasons.push("Preço acima da VWAP Anual (Macro Bullish)");
      if (vwap.annual.current > 0 && price < vwap.annual.current) reasons.push("Preço abaixo da VWAP Anual (Macro Bearish)");
      if (pivots && price > pivots.pivot) reasons.push("Preço acima do Pivot Point Diário");
      if (pivots && price < pivots.pivot) reasons.push("Preço abaixo do Pivot Point Diário");

      const entry = price;
      const stopLoss = signal === 'COMPRA' ? entry * 0.95 : entry * 1.05;
      const takeProfit = signal === 'COMPRA' ? entry * 1.15 : entry * 0.85;

      setSignalDetails({ signal, entry, stopLoss, takeProfit, reasons });

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
        
        // Update the last candle to make the chart move in real-time
        setMarketData(prevData => {
            if (prevData.length === 0) return [];
            const newData = [...prevData];
            const lastCandle = { ...newData[newData.length - 1] };
            lastCandle.close = price;
             // Also update high/low for realism
            lastCandle.high = Math.max(lastCandle.high, price);
            lastCandle.low = Math.min(lastCandle.low, price);
            newData[newData.length - 1] = lastCandle;
            
            // Regenerate signal with the latest price and data
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
          
          {/* Top Section: Price and Key Levels */}
          <div className="lg:col-span-2">
            <SignalCard signalDetails={signalDetails} currentPrice={currentPrice} />
          </div>
          <div className="lg:col-span-1">
            <KeyLevelsCard pivots={indicators?.pivots ?? null} vwap={indicators?.vwap ?? null} currentPrice={currentPrice} fibonacci={indicators?.fibonacci ?? null} />
          </div>

          {/* Main Analysis Section */}
          <div className="lg:col-span-2">
            <QualitativeAnalysisCard 
                geminiAnalysis={geminiAnalysis} 
                isAnalysisLoading={isAnalysisLoading} 
                marketData={marketData}
                vwap={indicators?.vwap ?? null}
                fibonacci={indicators?.fibonacci ?? null}
                signalDetails={signalDetails}
            />
          </div>
          <div className="lg:col-span-1">
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