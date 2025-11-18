import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Signal, SignalDetails, AnalysisResult } from '../types';

interface RiskCalculatorCardProps {
  signalDetails: SignalDetails | null;
  geminiAnalysis: AnalysisResult | null;
  isAnalysisLoading: boolean;
  usdBrlRate: number;
}

/**
 * Formats the lot size to have a dynamic number of decimal places for better readability.
 * @param lotSize The calculated lot size.
 * @returns A formatted string representation of the lot size.
 */
const formatLotSize = (lotSize: number): string => {
    if (lotSize >= 10) {
        return lotSize.toFixed(2); // e.g., 12.34
    }
    if (lotSize >= 1) {
        return lotSize.toFixed(3); // e.g., 1.234
    }
    if (lotSize >= 0.01) {
        return lotSize.toFixed(4); // e.g., 0.1234
    }
    return lotSize.toFixed(5); // For very small sizes, keep precision
};


const RiskCalculatorCard: React.FC<RiskCalculatorCardProps> = ({ signalDetails, geminiAnalysis, isAnalysisLoading, usdBrlRate }) => {
    const [bankroll, setBankroll] = useState<number>(1000);
    const [leverage, setLeverage] = useState<number>(50);
    const [takeProfitBRL, setTakeProfitBRL] = useState('');
    const [userModifiedTakeProfit, setUserModifiedTakeProfit] = useState(false);
    const prevSignalTypeRef = useRef<Signal | null>(null);

    useEffect(() => {
        const currentSignalType = signalDetails?.signal;

        // Reset and suggest a new take profit if the core signal changes (e.g., COMPRA -> VENDA)
        if (currentSignalType && prevSignalTypeRef.current !== currentSignalType) {
            setUserModifiedTakeProfit(false);
            prevSignalTypeRef.current = currentSignalType;
        }

        // Only update automatically if the user has not yet modified the input for the current signal type
        if (!userModifiedTakeProfit) {
            if (signalDetails?.takeProfit && usdBrlRate > 0) {
                const brlValue = signalDetails.takeProfit * usdBrlRate;
                setTakeProfitBRL(brlValue.toFixed(2));
            } else {
                setTakeProfitBRL('');
            }
        }
    }, [signalDetails, usdBrlRate, userModifiedTakeProfit]);

    const riskLevels = {
        'Risco baixo': [1, 5, 10, 25],
        'Risco médio': [50, 100, 200],
        'Risco alto': [500, 1000],
    };

    const calculation = useMemo(() => {
        // parseFloat works correctly with the raw numeric string in state
        const takeProfitPriceUSD = parseFloat(takeProfitBRL) / usdBrlRate;

        if (!signalDetails || !signalDetails.entry || !signalDetails.stopLoss || !takeProfitPriceUSD || isNaN(takeProfitPriceUSD) || bankroll <= 0 || leverage <= 0) {
            return null;
        }

        const positionValue = bankroll * leverage;
        const lotSize = positionValue / signalDetails.entry;
        
        const priceRiskPerCoin = Math.abs(signalDetails.entry - signalDetails.stopLoss);
        const riskAmount = lotSize * priceRiskPerCoin;
        
        const profitAmount = Math.abs(takeProfitPriceUSD - signalDetails.entry) * lotSize;

        return {
            rawLotSize: lotSize,
            lotSize: formatLotSize(lotSize),
            riskAmount: riskAmount.toFixed(2),
            profitAmount: profitAmount.toFixed(2),
            positionValue: positionValue.toFixed(2),
        };
    }, [bankroll, leverage, signalDetails, takeProfitBRL, usdBrlRate]);

    const handleBankrollChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setBankroll(isNaN(value) ? 0 : value);
    };

    const handleTakeProfitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserModifiedTakeProfit(true); // Mark that the user has interacted
        // Get only digits from the input string
        const digits = e.target.value.replace(/\D/g, '');
        if (digits === '') {
            setTakeProfitBRL('');
            return;
        }
        // Convert the digits (as cents) to a numeric value
        const numberValue = Number(digits) / 100;
        // Update state with the raw number as a string with two decimal places
        setTakeProfitBRL(numberValue.toFixed(2));
    };
    
    // Format the raw numeric string into BRL currency format for display
    const formattedTakeProfit = useMemo(() => {
        if (takeProfitBRL === '') return '';
        const numericValue = parseFloat(takeProfitBRL);
        if (isNaN(numericValue)) return '';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue);
    }, [takeProfitBRL]);

    return (
        <div className="bg-shark p-4 md:p-6 rounded-lg shadow-lg border border-tuna h-full flex flex-col">
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Calculadora de Risco</h2>
                <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <label htmlFor="takeProfit" className="block text-sm font-medium text-nevada mb-1">Valor Meta (BRL)</label>
                            <input
                                type="text"
                                id="takeProfit"
                                value={formattedTakeProfit}
                                onChange={handleTakeProfitChange}
                                className="w-full bg-bunker border border-tuna rounded-md p-2 text-spindle focus:ring-cyan-accent focus:border-cyan-accent"
                                placeholder="R$ 0,00"
                                disabled={!signalDetails || usdBrlRate <= 0}
                            />
                        </div>
                    </div>
                    <div>
                         {Object.entries(riskLevels).map(([levelName, leverages]) => (
                            <div key={levelName} className="mb-3">
                                <p className="text-sm text-nevada mb-2">{levelName}</p>
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {leverages.map(lev => (
                                    <button
                                        key={lev}
                                        onClick={() => setLeverage(lev)}
                                        className={`flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-semibold transition-colors duration-200 ${
                                            leverage === lev
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-tuna hover:bg-shark text-spindle'
                                        }`}
                                    >
                                        1:{lev}
                                        {leverage === lev && (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ml-1.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        )}
                                    </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-4 sm:mt-6 border-t border-tuna pt-4">
                    <h3 className="font-semibold text-spindle text-center mb-4">Projeção da Operação (Sinal Atual)</h3>
                    {calculation && signalDetails ? (
                        <>
                             <div className="text-center mb-3">
                                <span className="text-sm text-nevada">Preço de Entrada do Sinal: </span>
                                <span className="font-mono text-lg font-bold text-spindle">${signalDetails.entry.toFixed(3)}</span>
                            </div>
                            <div className="text-center bg-bunker rounded-lg p-4 mb-4">
                                <h4 className="text-sm font-medium text-nevada uppercase tracking-wider">Lote Sugerido (BTC)</h4>
                                <p className="text-4xl font-bold text-cyan-accent my-1">{calculation.lotSize}</p>
                                <p className="text-xs text-tuna">Baseado na sua banca e alavancagem selecionada.</p>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm sm:text-base">
                                    <span className="text-nevada">Valor da Posição (USD):</span>
                                    <span className="font-bold text-spindle">${calculation.positionValue}</span>
                                </div>
                                <div className="flex justify-between text-sm sm:text-base">
                                    <span className="text-nevada">Risco Financeiro:</span>
                                    <span className="font-bold text-red-accent">-${calculation.riskAmount}</span>
                                </div>
                                <div className="flex justify-between text-sm sm:text-base">
                                    <span className="text-nevada">Retorno Potencial:</span>
                                    <span className="font-bold text-green-accent">+${calculation.profitAmount}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-nevada text-sm">Insira os dados e aguarde um sinal para calcular a projeção.</p>
                        </div>
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
                        <div className="space-y-4">
                            {geminiAnalysis.buyOrders.map((order, index) => {
                                const profit = Math.abs(order.takeProfit - order.price) * calculation.rawLotSize;
                                const risk = Math.abs(order.price - order.stopLoss) * calculation.rawLotSize;
                                const rrRatio = risk > 0 ? (profit / risk).toFixed(2) : '∞';

                                return (
                                    <div key={`buy-${index}`} className="bg-bunker p-3 rounded-lg border-l-4 border-green-accent">
                                        <div className="flex justify-between items-baseline">
                                            <h4 className="text-sm font-semibold text-green-accent">{order.type}</h4>
                                            <p className="text-lg font-mono text-white">
                                                @ ${order.price.toFixed(3)}
                                            </p>
                                        </div>
                                        <p className="text-xs text-nevada mt-2 mb-3 italic">{order.reason}</p>
                                        <div className="mt-2 pt-2 border-t border-tuna/50 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                            <div className="text-nevada">Lucro Potencial</div>
                                            <div className="text-right font-mono text-green-accent font-semibold">+${profit.toFixed(2)}</div>
                                            
                                            <div className="text-nevada">Risco Estimado</div>
                                            <div className="text-right font-mono text-red-accent font-semibold">-${risk.toFixed(2)}</div>

                                            <div className="text-nevada">Risco/Retorno</div>
                                            <div className="text-right font-mono text-cyan-accent font-semibold">1 : {rrRatio}</div>
                                        </div>
                                    </div>
                                );
                            })}
                            {geminiAnalysis.sellOrders.map((order, index) => {
                                const profit = Math.abs(order.price - order.takeProfit) * calculation.rawLotSize;
                                const risk = Math.abs(order.stopLoss - order.price) * calculation.rawLotSize;
                                const rrRatio = risk > 0 ? (profit / risk).toFixed(2) : '∞';
                                
                                return (
                                   <div key={`sell-${index}`} className="bg-bunker p-3 rounded-lg border-l-4 border-red-accent">
                                        <div className="flex justify-between items-baseline">
                                            <h4 className="text-sm font-semibold text-red-accent">{order.type}</h4>
                                            <p className="text-lg font-mono text-white">
                                                @ ${order.price.toFixed(3)}
                                            </p>
                                        </div>
                                        <p className="text-xs text-nevada mt-2 mb-3 italic">{order.reason}</p>
                                         <div className="mt-2 pt-2 border-t border-tuna/50 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                            <div className="text-nevada">Lucro Potencial</div>
                                            <div className="text-right font-mono text-green-accent font-semibold">+${profit.toFixed(2)}</div>
                                            
                                            <div className="text-nevada">Risco Estimado</div>
                                            <div className="text-right font-mono text-red-accent font-semibold">-${risk.toFixed(2)}</div>

                                            <div className="text-nevada">Risco/Retorno</div>
                                            <div className="text-right font-mono text-cyan-accent font-semibold">1 : {rrRatio}</div>
                                        </div>
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
                <p className="text-xs text-tuna mt-4 text-center">Use alavancagem com cautela. As perdas podem exceder o seu depósito inicial.</p>
            </div>
        </div>
    );
};

export default RiskCalculatorCard;