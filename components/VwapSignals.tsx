import React from 'react';
import type { VwapData, PivotPoints } from '../types';

interface KeyLevelsCardProps {
  vwap: VwapData | null;
  pivots: PivotPoints | null;
  currentPrice: number;
}

const LevelRow: React.FC<{ label: string; value: number; prevValue?: number; colorClass: string; isResistance: boolean; currentPrice: number }> = ({ label, value, prevValue, colorClass, isResistance, currentPrice }) => {
    const isNear = value > 0 && Math.abs(currentPrice - value) / value < 0.01; // within 1%
    return (
        <div className={`flex justify-between items-center p-2 rounded ${isNear ? 'bg-bunker' : ''}`}>
            <span className={`text-sm font-semibold ${colorClass}`}>{label}</span>
            <div className="text-right">
                <span className={`text-sm font-mono ${isResistance ? 'text-red-accent' : 'text-green-accent'}`}>
                    ${value.toFixed(2)}
                </span>
                {prevValue && prevValue > 0 && (
                    <span className="block text-xs text-nevada font-mono">
                        Anterior: ${prevValue.toFixed(2)}
                    </span>
                )}
            </div>
        </div>
    );
};


const KeyLevelsCard: React.FC<KeyLevelsCardProps> = ({ vwap, pivots, currentPrice }) => {
  return (
    <div className="bg-shark p-4 md:p-6 rounded-lg shadow-lg border border-tuna h-full">
      <h2 className="text-xl font-bold text-white mb-4">Níveis Chave de Preço</h2>
      <div className="space-y-2">
        {pivots && <LevelRow label="R3" value={pivots.r3} colorClass="text-nevada" isResistance={true} currentPrice={currentPrice} />}
        {pivots && <LevelRow label="R2" value={pivots.r2} colorClass="text-nevada" isResistance={true} currentPrice={currentPrice} />}
        {pivots && <LevelRow label="R1" value={pivots.r1} colorClass="text-nevada" isResistance={true} currentPrice={currentPrice} />}
        {vwap?.annual && <LevelRow label="VWAP Anual" value={vwap.annual.current} colorClass="text-cyan-accent font-bold" isResistance={currentPrice < vwap.annual.current} currentPrice={currentPrice} />}
        {vwap?.monthly && <LevelRow label="VWAP Mensal" value={vwap.monthly.current} prevValue={vwap.monthly.previous} colorClass="text-cyan-accent" isResistance={currentPrice < vwap.monthly.current} currentPrice={currentPrice} />}
        {pivots && <LevelRow label="Pivot Point" value={pivots.pivot} colorClass="text-spindle font-bold" isResistance={currentPrice < pivots.pivot} currentPrice={currentPrice} />}
        {vwap?.weekly && <LevelRow label="VWAP Semanal" value={vwap.weekly.current} prevValue={vwap.weekly.previous} colorClass="text-cyan-accent" isResistance={currentPrice < vwap.weekly.current} currentPrice={currentPrice} />}
        {vwap?.daily && <LevelRow label="VWAP Diária" value={vwap.daily.current} prevValue={vwap.daily.previous} colorClass="text-cyan-accent" isResistance={currentPrice < vwap.daily.current} currentPrice={currentPrice} />}
        {pivots && <LevelRow label="S1" value={pivots.s1} colorClass="text-nevada" isResistance={false} currentPrice={currentPrice} />}
        {pivots && <LevelRow label="S2" value={pivots.s2} colorClass="text-nevada" isResistance={false} currentPrice={currentPrice} />}
        {pivots && <LevelRow label="S3" value={pivots.s3} colorClass="text-nevada" isResistance={false} currentPrice={currentPrice} />}
      </div>
    </div>
  );
};

export default KeyLevelsCard;