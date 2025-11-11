import React, { useState, useMemo } from 'react';
import type { SignalDetails, AnalysisResult } from '../types';

interface RiskCalculatorCardProps {
  signalDetails: SignalDetails | null;
  geminiAnalysis: AnalysisResult | null;
  isAnalysisLoading: boolean;
}

const RiskCalculatorCard: React.FC<RiskCalculatorCardProps> = ({ signalDetails, geminiAnalysis, isAnalysisLoading }) => {
    const [bankroll, setBankroll] = useState<number>(1000);
    const [riskProfile, setRiskProfile] = useState<'conservative' | 'aggressive'>('conservative');

    const riskPercentage = riskProfile === 'conservative' ? 0.01 : 0.03;

    const calculation = useMemo(() => {
        if (!signalDetails || !signalDetails.entry || !signalDetails.stopLoss || bankroll <= 0) {
            return null;
        }

        const riskAmount = bankroll * riskPercentage;
        const priceRiskPerCoin = Math.abs(signalDetails.entry - signalDetails.stopLoss);
        
        if (priceRiskPerCoin === 0) return null;

        const lotSize = riskAmount / priceRiskPerCoin;
        const positionValue = lotSize * signalDetails.entry;
        const suggestedLeverage = Math.max(1, Math.ceil(positionValue / bankroll));
        
        const profitAmount = Math.abs(signalDetails.takeProfit - signalDetails.entry) * lotSize;

        return {
            lotSize: lotSize.toFixed(5),
            riskAmount: riskAmount.toFixed(2),
            profitAmount: profitAmount.toFixed(2),
            suggestedLeverage,
        };
    }, [bankroll, riskProfile, signalDetails]);

    const handleBankrollChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setBankroll(isNaN(value) ? 0 : value);
    };

    return (
        <div className="bg-shark p-6 rounded-lg shadow-lg border border-tuna h-full flex flex-col">
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Calculadora de Risco</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="bankroll" className="block text-sm font-medium text-nevada mb-1">Sua Banca (USD)</label>
                        <input
                            type="number"
                            id="bankroll"
                            value={bankroll}
                            onChange={handleBankrollChange}
                            className="w-full bg-bunker border border-tuna rounded-md p-2 text-spindle focus:ring-cyan-accent focus:border-cyan-accent"
                            placeholder="Ex: 1000"
                        />
                    </div>
                    <div>
                        <label htmlFor="riskProfile" className="block text-sm font-medium text-nevada mb-1">Perfil de Risco</label>
                        <select
                            id="riskProfile"
                            value={riskProfile}
                            onChange={(e) => setRiskProfile(e.target.value as 'conservative' | 'aggressive')}
                            className="w-full bg-bunker border border-tuna rounded-md p-2 text-spindle focus:ring-cyan-accent focus:border-cyan-accent"
                        >
                            <option value="conservative">Conservador (1% Risco)</option>
                            <option value="aggressive">Agressivo (3% Risco)</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6 border-t border-tuna pt-4 space-y-3">
                    <h3 className="font-semibold text-spindle text-center mb-4">Projeção da Operação (Sinal Atual)</h3>
                    {calculation ? (
                        <>
                            <div className="flex justify-between text-base">
                                <span className="text-nevada">Tamanho do Lote (BTC):</span>
                                <span className="font-bold text-spindle">{calculation.lotSize}</span>
                            </div>
                            <div className="flex justify-between text-base">
                                <span className="text-nevada">Alavancagem Sugerida:</span>
                                <span className="font-bold text-spindle">{calculation.suggestedLeverage}x</span>
                            </div>
                            <div className="flex justify-between text-base">
                                <span className="text-nevada">Risco Financeiro:</span>
                                <span className="font-bold text-red-accent">-${calculation.riskAmount}</span>
                            </div>
                            <div className="flex justify-between text-base">
                                <span className="text-nevada">Retorno Potencial:</span>
                                <span className="font-bold text-green-accent">+${calculation.profitAmount}</span>
                            </div>
                        </>
                    ) : (
                        <p className="text-nevada text-center text-sm">Insira a banca e aguarde um sinal para calcular.</p>
                    )}
                </div>
            </div>
            
            <div className="mt-6 border-t border-tuna pt-4 flex-grow flex flex-col">
                <h3 className="font-semibold text-spindle text-center mb-4">Ordens Pendentes (Análise IA)</h3>
                <div className="flex-grow">
                    {isAnalysisLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="w-6 h-6 border-2 border-tuna border-t-cyan-accent rounded-full animate-spin"></div>
                        </div>
                    ) : geminiAnalysis && calculation ? (
                        <div className="space-y-3">
                            {geminiAnalysis.buyOrders.map((order, index) => {
                                const profit = Math.abs(order.takeProfit - order.price) * parseFloat(calculation.lotSize);
                                return (
                                    <div key={`buy-${index}`} className="bg-bunker p-3 rounded-md border border-tuna/50">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-green-accent text-sm">{order.type} @ ${order.price.toFixed(2)}</span>
                                            <span className="font-mono text-xs text-green-accent">Lucro: +${profit.toFixed(2)}</span>
                                        </div>
                                        <p className="text-xs text-nevada mt-1">{order.reason}</p>
                                    </div>
                                );
                            })}
                            {geminiAnalysis.sellOrders.map((order, index) => {
                                const profit = Math.abs(order.price - order.takeProfit) * parseFloat(calculation.lotSize);
                                return (
                                    <div key={`sell-${index}`} className="bg-bunker p-3 rounded-md border border-tuna/50">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-red-accent text-sm">{order.type} @ ${order.price.toFixed(2)}</span>
                                            <span className="font-mono text-xs text-green-accent">Lucro: +${profit.toFixed(2)}</span>
                                        </div>
                                        <p className="text-xs text-nevada mt-1">{order.reason}</p>
                                    </div>
                                );
                            })}
                            {geminiAnalysis.buyOrders.length === 0 && geminiAnalysis.sellOrders.length === 0 && (
                                <p className="text-nevada text-center text-sm">Nenhuma ordem pendente sugerida pela IA no momento.</p>
                            )}
                        </div>
                    ) : (
                        <p className="text-nevada text-center text-sm">Cálculos e ordens da IA aparecerão aqui.</p>
                    )}
                </div>
                <p className="text-xs text-tuna mt-4 text-center">A alavancagem sugerida é o mínimo para abrir a posição. Use com cautela.</p>
            </div>
        </div>
    );
};

export default RiskCalculatorCard;