import React, { useMemo } from 'react';
import type { AnalysisResult, Candle, VwapData } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine, Legend } from 'recharts';

interface QualitativeAnalysisCardProps {
    geminiAnalysis: AnalysisResult | null;
    isAnalysisLoading: boolean;
    marketData: Candle[];
    vwap: VwapData | null;
}

const QualitativeAnalysisCard: React.FC<QualitativeAnalysisCardProps> = ({ geminiAnalysis, isAnalysisLoading, marketData, vwap }) => {
    
    const recentData = marketData.slice(-60); // Show last 60 data points for better context

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

    const buyZonePrice = buyOrder?.price;
    const sellZonePrice = sellOrder?.price;
    const buyTakeProfit = buyOrder?.takeProfit;
    const buyStopLoss = buyOrder?.stopLoss;
    const sellTakeProfit = sellOrder?.takeProfit;
    const sellStopLoss = sellOrder?.stopLoss;

    // Calculate y-domain to make sure zones and all lines are fully visible
    const prices = recentData.length > 0 ? recentData.map(d => d.close) : [0];
    const allLevels = [
        buyZonePrice, sellZonePrice, 
        buyTakeProfit, buyStopLoss, 
        sellTakeProfit, sellStopLoss,
        vwap?.daily.current,
        vwap?.weekly.current,
        vwap?.monthly.current,
        vwap?.annual.current,
    ].filter((p): p is number => p !== undefined && p !== null && p > 0);


    const minPrice = allLevels.length > 0 ? Math.min(...prices, ...allLevels) : Math.min(...prices);
    const maxPrice = allLevels.length > 0 ? Math.max(...prices, ...allLevels) : Math.max(...prices);
    const domainMargin = (maxPrice - minPrice) * 0.1;
    const yDomain: [number, number] = [
        Math.floor((minPrice - domainMargin) / 100) * 100, 
        Math.ceil((maxPrice + domainMargin) / 100) * 100
    ];

    if (recentData.length === 0) {
        return null; // Don't render chart if no data
    }

    return (
        <div className="bg-shark p-4 md:p-6 rounded-lg shadow-lg border border-tuna">
            <h2 className="text-xl font-bold text-white mb-6">Análise Gráfica (IA)</h2>
            
            <div className="w-full h-64 md:h-80 mb-6">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3b404d" strokeOpacity={0.5} />
                        <XAxis 
                            dataKey="date" 
                            tickFormatter={(tick) => new Date(tick).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit'})} 
                            tick={{ fill: '#94a3b8', fontSize: 12 }} 
                            axisLine={{ stroke: '#3b404d' }}
                            tickLine={{ stroke: '#3b404d' }}
                        />
                        <YAxis 
                            domain={yDomain} 
                            tickFormatter={(tick) => `$${(tick / 1000).toFixed(1)}k`} 
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            axisLine={{ stroke: '#3b404d' }}
                            tickLine={{ stroke: '#3b404d' }}
                            orientation="left"
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#10141f', border: '1px solid #3b404d', borderRadius: '0.5rem' }}
                            labelStyle={{ color: '#e2e8f0' }}
                            formatter={(value: number) => [`$${value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, '']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                        />
                        
                         <Legend verticalAlign="top" height={36} wrapperStyle={{fontSize: "12px"}}/>
                        
                        {buyZonePrice && (
                        <ReferenceArea y1={buyZonePrice * 0.995} y2={buyZonePrice * 1.005} strokeOpacity={0.2} fill="#39ff14" fillOpacity={0.15} label={{ value: 'Zona de Compra', position: 'insideTopLeft', fill: '#e2e8f0', fontSize: 12, dy: 10, dx: 10 }} />
                        )}

                        {sellZonePrice && (
                        <ReferenceArea y1={sellZonePrice * 0.995} y2={sellZonePrice * 1.005} strokeOpacity={0.2} fill="#ff4d4d" fillOpacity={0.15} label={{ value: 'Zona de Venda', position: 'insideBottomLeft', fill: '#e2e8f0', fontSize: 12, dy: -10, dx: 10 }} />
                        )}

                        {/* Buy Order TP/SL Lines */}
                        {buyTakeProfit && <ReferenceLine y={buyTakeProfit} label={{ value: `TP Compra`, fill: '#e2e8f0', fontSize: 10, position: 'insideRight' }} stroke="#39ff14" strokeDasharray="4 4" />}
                        {buyStopLoss && <ReferenceLine y={buyStopLoss} label={{ value: `SL Compra`, fill: '#e2e8f0', fontSize: 10, position: 'insideRight' }} stroke="#ff4d4d" strokeDasharray="4 4" />}
                        
                        {/* Sell Order TP/SL Lines */}
                        {sellTakeProfit && <ReferenceLine y={sellTakeProfit} label={{ value: `TP Venda`, fill: '#e2e8f0', fontSize: 10, position: 'insideRight' }} stroke="#39ff14" strokeDasharray="4 4" />}
                        {sellStopLoss && <ReferenceLine y={sellStopLoss} label={{ value: `SL Venda`, fill: '#e2e8f0', fontSize: 10, position: 'insideRight' }} stroke="#ff4d4d" strokeDasharray="4 4" />}
                        
                        <Line type="monotone" dataKey="close" name="Preço" stroke="#00e1ff" strokeWidth={2} dot={false} />

                        {/* VWAP Lines */}
                        <Line type="monotone" dataKey="vwapDaily" name="VWAP Diária" stroke="#ffd700" strokeWidth={1.5} dot={false} />
                        <Line type="monotone" dataKey="vwapWeekly" name="VWAP Semanal" stroke="#ff69b4" strokeWidth={1.5} dot={false} />
                        <Line type="monotone" dataKey="vwapMonthly" name="VWAP Mensal" stroke="#4169e1" strokeWidth={1.5} dot={false} />
                        <Line type="monotone" dataKey="vwapAnnual" name="VWAP Anual" stroke="#39ff14" strokeWidth={1.5} dot={false} />


                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-bunker p-4 rounded-md min-h-[100px] flex flex-col justify-center">
                {isAnalysisLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-nevada text-sm">Gerando análise com IA...</p>
                    </div>
                ) : geminiAnalysis?.sentiment ? (
                    <>
                        <h3 className="font-semibold text-spindle mb-2">Sentimento de Mercado</h3>
                        <p className="text-nevada text-base">{geminiAnalysis.sentiment}</p>
                    </>
                ) : (
                    <p className="text-nevada text-base text-center">Análise da IA indisponível no momento.</p> 
                )}
            </div>
            <div className="bg-bunker p-4 rounded-md mt-4">
                <h3 className="font-semibold text-spindle mb-2">Sugestão de Estratégia</h3>
                <p className="text-nevada text-base">Para uma entrada estratégica, considere posicionar ordens limites perto de níveis chave (VWAPs, Pivots), aguardando um reteste antes do preço continuar sua tendência.</p>
            </div>
        </div>
    );
};

export default QualitativeAnalysisCard;