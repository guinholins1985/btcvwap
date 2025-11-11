import React, { useState, useEffect } from 'react';
import type { SignalDetails } from '../types';

interface SignalCardProps {
  signalDetails: SignalDetails | null;
  currentPrice: number;
}

const SignalTag: React.FC<{ signal: 'COMPRA' | 'VENDA' | 'MANTER' }> = ({ signal }) => {
    const styles = {
        'COMPRA': 'bg-green-accent text-bunker',
        'VENDA': 'bg-red-accent text-bunker',
        'MANTER': 'bg-tuna text-spindle',
    };
    return <span className={`px-4 py-1 text-sm font-bold rounded-full uppercase ${styles[signal]}`}>{signal}</span>;
}

const PriceDisplay: React.FC<SignalCardProps> = ({ signalDetails, currentPrice }) => {
    const [prevPrice, setPrevPrice] = useState(currentPrice);
    const [priceChange, setPriceChange] = useState<number>(0);

    useEffect(() => {
        if(currentPrice !== prevPrice) {
            setPriceChange(currentPrice > prevPrice ? 1 : -1);
            setPrevPrice(currentPrice);
            const timer = setTimeout(() => setPriceChange(0), 500);
            return () => clearTimeout(timer);
        }
    }, [currentPrice, prevPrice]);

    const changeColorClass = priceChange === 1 ? 'text-green-accent' : priceChange === -1 ? 'text-red-accent' : 'text-spindle';

  return (
    <div className="bg-shark p-6 rounded-lg shadow-lg border border-tuna">
      <div className="flex justify-between items-start mb-4">
        <div>
            <h2 className="text-xl font-bold text-white mb-2">Sinal Atual</h2>
            {signalDetails ? <SignalTag signal={signalDetails.signal} /> : <div className="h-7"></div>}
        </div>
        <div>
            <h2 className="text-nevada text-base font-medium mb-1 text-right">Preço Atual (BTC/USD)</h2>
            <p className={`text-3xl font-bold transition-colors duration-500 text-right ${changeColorClass}`}>
                ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 text-center">
        <div>
            <h3 className="text-sm text-nevada uppercase tracking-wider">Stop Loss (Risco ~5%)</h3>
            <p className="text-xl font-semibold text-red-accent mt-1">${signalDetails?.stopLoss.toFixed(2) ?? '...'}</p>
        </div>
        <div>
            <h3 className="text-sm text-nevada uppercase tracking-wider">Preço de Entrada</h3>
            <p className="text-xl font-semibold text-spindle mt-1">${signalDetails?.entry.toFixed(2) ?? '...'}</p>
        </div>
        <div>
            <h3 className="text-sm text-nevada uppercase tracking-wider">Take Profit (Alvo ~15%)</h3>
            <p className="text-xl font-semibold text-green-accent mt-1">${signalDetails?.takeProfit.toFixed(2) ?? '...'}</p>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Motivos de Confluência</h3>
        <ul className="space-y-2">
            {signalDetails?.reasons.map((reason, index) => (
                <li key={index} className="flex items-center text-nevada text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-accent mr-2 flex-shrink-0"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>{reason}</span>
                </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default PriceDisplay;
