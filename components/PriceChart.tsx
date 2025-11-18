import React, { useMemo } from 'react';
import type { AnalysisResult, Candle, VwapData, SignalDetails, Signal, FibonacciLevels, IndicatorSeries } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Line } from 'recharts';
import SentimentGauge from './SentimentGauge';

interface QualitativeAnalysisCardProps {
    geminiAnalysis: AnalysisResult | null;
    isAnalysisLoading: boolean;
    marketData: Candle[];
    vwap: VwapData | null;
    signalDetails: SignalDetails | null;
    fibonacci: FibonacciLevels | null;
    indicatorSeries: IndicatorSeries | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-bunker/80 backdrop-blur-sm p-2 rounded-md border border-tuna text-xs shadow-lg">
          <p className="label text-spindle font-bold mb-1">{new Date(label).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
          <p className="text-cyan-accent font-semibold">{`Preço: $${data.close.toFixed(3)}`}</p>
          {data.ema50 && <p className="text-pink-accent font-mono text-xs">{`EMA 50: $${data.ema50.toFixed(3)}`}</p>}
          {data.ema200 && <p className="text-orange-accent font-mono text-xs">{`EMA 200: $${data.ema200.toFixed(3)}`}</p>}
        </div>
      );
    }
    return null;
  };

const QualitativeAnalysisCard: React.FC<QualitativeAnalysisCardProps> = ({ geminiAnalysis, isAnalysisLoading, marketData, vwap, signalDetails, fibonacci, indicatorSeries }) => {
    
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const sliceAmount = isMobile ? -60 : -120;
    const recentData = marketData.slice(sliceAmount);

    const chartData = useMemo(() => {
        if (!recentData.length) return [];
        
        const slicedEma50 = indicatorSeries?.ema50.slice(sliceAmount) ?? [];
        const slicedEma200 = indicatorSeries?.ema200.slice(sliceAmount) ?? [];

        return recentData.map((d, i) => ({
            ...d,
            vwapDaily: vwap?.daily.current,
            vwapWeekly: vwap?.weekly.current,
            vwapMonthly: vwap?.monthly.current,
            vwapAnnual: vwap?.annual.current,
            ema50: slicedEma50[i],
            ema200: slicedEma200[i],
        }));
    }, [recentData, vwap, indicatorSeries, sliceAmount]);

    const buyOrder = geminiAnalysis?.buyOrders?.[0];
    const sellOrder = geminiAnalysis?.sellOrders?.[0];

    const prices = recentData.length > 0 ? recentData.map(d => d.close) : [0];
    const fibLevels = fibonacci ? Object.values(fibonacci.levels) : [];
    const emaValues = chartData.flatMap(d => [d.ema50, d.ema200]).filter(v => v != null);

    const allLevels = [
        buyOrder?.price, sellOrder?.price, 
        signalDetails?.takeProfit, signalDetails?.stopLoss,
        vwap?.daily.current,
        vwap?.weekly.current,
        vwap?.monthly.current,
        vwap?.annual.current,
        ...fibLevels,
        ...emaValues,
    ].filter((p): p is number => p !== undefined && p !== null && p > 0);


    const minPrice = allLevels.length > 0 ? Math.min(...prices, ...allLevels) : Math.min(...prices);
    const maxPrice = allLevels.length > 0 ? Math.max(...prices, ...allLevels) : Math.max(...prices);
    const domainMargin = (maxPrice - minPrice) * 0.1;
    const yDomain: [number, number] = [
        Math.floor((minPrice - domainMargin) / 100) * 100, 
        Math.ceil((maxPrice + domainMargin) / 100) * 100
    ];

    if (recentData.length === 0) {
        return null;
    }

    const signal = signalDetails?.signal;

    const getStatusStyles = (signal: Signal | undefined) => {
        switch (signal) {
            case 'COMPRA': return { text: 'COMPRA', bg: 'bg-green-accent', textColor: 'text-bunker' };
            case 'VENDA': return { text: 'VENDA', bg: 'bg-red-accent', textColor: 'text-bunker' };
            case 'ROMPIMENTO': return { text: 'ROMPIMENTO', bg: 'bg-cyan-accent', textColor: 'text-bunker' };
            case 'RETRAÇÃO': return { text: 'RETRAÇÃO', bg: 'bg-yellow-500', textColor: 'text-bunker' };
            case 'NEUTRO': return { text: 'NEUTRO', bg: 'bg-tuna', textColor: 'text-spindle' };
            case 'MANTER': return { text: 'MANTER', bg: 'bg-tuna', textColor: 'text-spindle' };
            default: return { text: 'AGUARDANDO', bg: 'bg-shark', textColor: 'text-nevada' };
        }
    };
    
    const status = getStatusStyles(signal);


    return (
        <div className="bg-shark p-4 md:p-6 rounded-lg shadow-lg border border-tuna h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h2 className="text-xl font-bold text-white mb-2 sm:mb-0">Análise Gráfica e IA</h2>
                {signal && (
                    <div className={`px-3 py-1 rounded text-xs sm:text-sm font-bold uppercase shadow-lg ${status.bg} ${status.textColor}`}>
                        {status.text}
                    </div>
                )}
            </div>
            
            <div className="relative w-full h-72 md:h-80 mb-2">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: isMobile ? 5 : 20, left: isMobile ? -30 : -15, bottom: 0 }}>
                        <defs>
                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00e1ff" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#00e1ff" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3b404d" strokeOpacity={0.5} />
                        <XAxis 
                            dataKey="date" 
                            tickFormatter={(tick) => new Date(tick).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit'})} 
                            tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }} 
                            axisLine={{ stroke: '#3b404d' }}
                            tickLine={{ stroke: '#3b404d' }}
                            interval={isMobile ? 20 : 12}
                        />
                        <YAxis 
                            domain={yDomain} 
                            tickFormatter={(tick) => `$${(tick / 1000).toFixed(1)}k`} 
                            tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }}
                            axisLine={{ stroke: '#3b404d' }}
                            tickLine={{ stroke: '#3b404d' }}
                            orientation="left"
                            tickCount={isMobile ? 6 : 8}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        
                         <Legend verticalAlign="top" height={30} wrapperStyle={{fontSize: isMobile ? "10px" : "12px", paddingTop: "0px", paddingBottom: "10px"}}/>
                        
                        {/* Ordens Pendentes IA */}
                        {buyOrder?.price && (
                            <ReferenceLine y={buyOrder.price} label={{ value: `Buy Limit IA`, fill: '#e2e8f0', fontSize: isMobile ? 8 : 10, position: 'left' }} stroke="#39ff14" strokeDasharray="4 4" strokeOpacity={0.8} />
                        )}
                        {sellOrder?.price && (
                            <ReferenceLine y={sellOrder.price} label={{ value: `Sell Limit IA`, fill: '#e2e8f0', fontSize: isMobile ? 8 : 10, position: 'left' }} stroke="#ff4d4d" strokeDasharray="4 4" strokeOpacity={0.8} />
                        )}
                        
                        {/* Sinal Atual TP/SL */}
                        {(signalDetails?.signal === 'COMPRA' || signalDetails?.signal === 'VENDA') && signalDetails.takeProfit && (
                             <ReferenceLine y={signalDetails.takeProfit} label={{ value: 'Take Profit', fill: '#39ff14', fontSize: isMobile ? 8 : 10, position: 'right' }} stroke="#39ff14" strokeDasharray="2 2" />
                        )}
                        {(signalDetails?.signal === 'COMPRA' || signalDetails?.signal === 'VENDA') && signalDetails.stopLoss && (
                             <ReferenceLine y={signalDetails.stopLoss} label={{ value: 'Stop Loss', fill: '#ff4d4d', fontSize: isMobile ? 8 : 10, position: 'right' }} stroke="#ff4d4d" strokeDasharray="2 2" />
                        )}

                        {/* Níveis Fibonacci */}
                        {fibonacci && Object.entries(fibonacci.levels)
                            .map(([level, value]) => (
                            <ReferenceLine 
                                key={level} 
                                y={value} 
                                label={{ value: `Fib ${level}`, fill: '#facc15', fontSize: isMobile ? 8 : 10, position: 'right', dx: isMobile ? -30 : -45 }} 
                                stroke="#facc15"
                                strokeDasharray="3 3" 
                                strokeOpacity={0.7}
                            />
                        ))}

                        <Area type="monotone" dataKey="close" name="Preço" stroke="#00e1ff" strokeWidth={2} fillOpacity={1} fill="url(#priceGradient)" dot={false} />
                        <Line type="monotone" dataKey="ema50" name="EMA 50" stroke="#ec4899" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="ema200" name="EMA 200" stroke="#f97316" strokeWidth={2} dot={false} />

                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                    {isAnalysisLoading ? (
                         <div className="flex justify-center items-center h-full">
                            <p className="text-nevada text-sm">Carregando Sentimento...</p>
                        </div>
                    ) : geminiAnalysis?.sentiment ? (
                        <>
                            <h3 className="font-semibold text-spindle mb-2 text-center">Sentimento (IA)</h3>
                            <SentimentGauge sentiment={geminiAnalysis.sentiment} />
                        </>
                    ) : (
                         <p className="text-nevada text-base text-center">Sentimento IA indisponível.</p> 
                    )}
                </div>

                <div className="bg-bunker p-4 rounded-md flex flex-col justify-center">
                    {isAnalysisLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <p className="text-nevada text-sm">Gerando análise com IA...</p>
                        </div>
                    ) : geminiAnalysis?.sentiment ? (
                        <>
                            <h3 className="font-semibold text-spindle mb-3">Análise Qualitativa da IA</h3>
                            <p className="text-nevada text-sm italic mb-4">"{geminiAnalysis.sentiment}"</p>
                            <h3 className="font-semibold text-spindle mb-2">Sugestão de Estratégia</h3>
                            <p className="text-nevada text-sm">Considere ordens limites perto de níveis chave (EMAs, VWAPs, Pivots).</p>
                        </>
                    ) : (
                        <p className="text-nevada text-base text-center">Análise da IA indisponível no momento.</p> 
                    )}
                </div>
            </div>
        </div>
    );
};

export default QualitativeAnalysisCard;