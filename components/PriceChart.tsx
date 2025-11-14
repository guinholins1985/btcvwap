import React, { useMemo } from 'react';
import type { AnalysisResult, Candle, VwapData, SignalDetails, Signal, FibonacciLevels } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import SentimentGauge from './SentimentGauge';

interface QualitativeAnalysisCardProps {
    geminiAnalysis: AnalysisResult | null;
    isAnalysisLoading: boolean;
    marketData: Candle[];
    vwap: VwapData | null;
    signalDetails: SignalDetails | null;
    fibonacci: FibonacciLevels | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-bunker/80 backdrop-blur-sm p-3 rounded-md border border-tuna text-sm shadow-lg">
          <p className="label text-spindle font-bold mb-2">{new Date(label).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
          <p className="text-cyan-accent font-semibold">{`Preço: $${data.close.toFixed(3)}`}</p>
          <p className="text-nevada mt-1">{`Abertura: $${data.open.toFixed(3)}`}</p>
          <p className="text-nevada">{`Máxima: $${data.high.toFixed(3)}`}</p>
          <p className="text-nevada">{`Mínima: $${data.low.toFixed(3)}`}</p>
        </div>
      );
    }
    return null;
  };

const QualitativeAnalysisCard: React.FC<QualitativeAnalysisCardProps> = ({ geminiAnalysis, isAnalysisLoading, marketData, vwap, signalDetails, fibonacci }) => {
    
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const recentData = marketData.slice(isMobile ? -60 : -120);

    const chartData = useMemo(() => {
        if (!vwap) return recentData;
        return recentData.map(d => ({
            ...d,
            vwapDaily: vwap.daily.current,
            vwapWeekly: vwap.weekly.current,
            vwapMonthly: vwap.monthly.current,
            vwapAnnual: vwap.annual.current,
        }));
    }, [recentData, vwap]);

    const buyOrder = geminiAnalysis?.buyOrders?.[0];
    const sellOrder = geminiAnalysis?.sellOrders?.[0];

    const buyTakeProfit = buyOrder?.takeProfit;
    const buyStopLoss = buyOrder?.stopLoss;
    const sellTakeProfit = sellOrder?.takeProfit;
    const sellStopLoss = sellOrder?.stopLoss;

    const prices = recentData.length > 0 ? recentData.map(d => d.close) : [0];
    const fibLevels = fibonacci ? Object.values(fibonacci.levels) : [];
    const allLevels = [
        buyOrder?.price, sellOrder?.price, 
        buyTakeProfit, buyStopLoss, 
        sellTakeProfit, sellStopLoss,
        vwap?.daily.current,
        vwap?.weekly.current,
        vwap?.monthly.current,
        vwap?.annual.current,
        ...fibLevels,
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
    const getTitle = (signal: Signal | undefined) => {
        switch (signal) {
            case 'COMPRA': return 'Análise Gráfica: Oportunidade de Compra Detectada';
            case 'VENDA': return 'Análise Gráfica: Oportunidade de Venda Detectada';
            case 'ROMPIMENTO': return 'Análise Gráfica: Movimento de Rompimento';
            case 'RETRAÇÃO': return 'Análise Gráfica: Retração em Andamento';
            default: return 'Análise Gráfica (IA)';
        }
    };

    const status = getStatusStyles(signal);


    return (
        <div className="bg-shark p-4 md:p-6 rounded-lg shadow-lg border border-tuna h-full">
            <h2 className="text-xl font-bold text-white mb-6">{getTitle(signal)}</h2>
            
            <div className="relative w-full h-80 md:h-96 mb-4">
                {signal && (
                    <div className={`absolute top-0 right-0 z-10 px-3 py-1 rounded-bl-lg rounded-tr-md text-xs font-bold uppercase shadow-lg ${status.bg} ${status.textColor}`}>
                        {status.text}
                    </div>
                )}
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: isMobile ? 5 : 20, left: isMobile ? -25 : -15, bottom: 0 }}>
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
                            interval={isMobile ? 12 : 12}
                        />
                        <YAxis 
                            domain={yDomain} 
                            tickFormatter={(tick) => `$${(tick / 1000).toFixed(1)}k`} 
                            tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }}
                            axisLine={{ stroke: '#3b404d' }}
                            tickLine={{ stroke: '#3b404d' }}
                            orientation="left"
                        />
                        <Tooltip content={<CustomTooltip />} />
                        
                         <Legend verticalAlign="top" height={36} wrapperStyle={{fontSize: isMobile ? "10px" : "12px", paddingTop: "5px", paddingBottom: "5px"}}/>
                        
                        {buyOrder?.price && <ReferenceLine y={buyOrder.price} label={{ value: `Ordem Compra ${buyOrder.price.toFixed(3)}`, fill: '#e2e8f0', fontSize: isMobile ? 9 : 10, position: 'insideLeft', dx: 10 }} stroke="#39ff14" strokeDasharray="8 8" />}
                        {sellOrder?.price && <ReferenceLine y={sellOrder.price} label={{ value: `Ordem Venda ${sellOrder.price.toFixed(3)}`, fill: '#e2e8f0', fontSize: isMobile ? 9 : 10, position: 'insideLeft', dx: 10 }} stroke="#ff4d4d" strokeDasharray="8 8" />}

                        {buyTakeProfit && <ReferenceLine y={buyTakeProfit} label={{ value: `TP Compra`, fill: '#e2e8f0', fontSize: isMobile ? 9 : 10, position: 'insideRight' }} stroke="#39ff14" strokeDasharray="4 4" />}
                        {buyStopLoss && <ReferenceLine y={buyStopLoss} label={{ value: `SL Compra`, fill: '#e2e8f0', fontSize: isMobile ? 9 : 10, position: 'insideRight' }} stroke="#ff4d4d" strokeDasharray="4 4" />}
                        
                        {sellTakeProfit && <ReferenceLine y={sellTakeProfit} label={{ value: `TP Venda`, fill: '#e2e8f0', fontSize: isMobile ? 9 : 10, position: 'insideRight' }} stroke="#39ff14" strokeDasharray="4 4" />}
                        {sellStopLoss && <ReferenceLine y={sellStopLoss} label={{ value: `SL Venda`, fill: '#e2e8f0', fontSize: isMobile ? 9 : 10, position: 'insideRight' }} stroke="#ff4d4d" strokeDasharray="4 4" />}
                        
                        {fibonacci && Object.entries(fibonacci.levels).map(([level, value]) => (
                            <ReferenceLine 
                                key={level} 
                                y={value} 
                                label={{ value: `Fib ${level}`, fill: '#facc15', fontSize: isMobile ? 8 : 10, position: 'right', dx: isMobile ? -35 : -50 }} 
                                stroke="#facc15"
                                strokeDasharray="3 3" 
                                strokeOpacity={0.7}
                            />
                        ))}

                        <Area type="monotone" dataKey="close" name="Preço" stroke="#00e1ff" strokeWidth={2} fillOpacity={1} fill="url(#priceGradient)" dot={false} />

                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
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
                            <p className="text-nevada text-sm">Considere ordens limites perto de níveis chave (VWAPs, Pivots).</p>
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