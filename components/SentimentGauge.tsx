import React from 'react';

interface SentimentGaugeProps {
    sentiment: string;
}

const SentimentGauge: React.FC<SentimentGaugeProps> = ({ sentiment }) => {
    // A simple keyword-based sentiment analysis to get a value from 0 to 100
    const getSentimentValue = (text: string): number => {
        const lowerText = text.toLowerCase();
        // Bullish keywords
        if (/\b(otimismo|otimista|alta|subir|bullish|compra forte|rompimento de alta|macro bullish)\b/.test(lowerText)) {
            return 85; // Strong Bullish
        }
        if (/\b(positivo|viés de alta|potencial de alta|acima da vwap)\b/.test(lowerText)) {
            return 65; // Mildly Bullish
        }
        // Bearish keywords
        if (/\b(pessimismo|pessimista|baixa|cair|bearish|venda forte|rompimento de baixa|macro bearish)\b/.test(lowerText)) {
            return 15; // Strong Bearish
        }
        if (/\b(negativo|viés de baixa|risco de queda|abaixo da vwap)\b/.test(lowerText)) {
            return 35; // Mildly Bearish
        }
        // Neutral keywords
        if (/\b(cautela|neutro|indecisão|lateralizado|consolidado|equilíbrio)\b/.test(lowerText)) {
            return 50; // Neutral
        }
        return 50; // Default to neutral
    };

    const value = getSentimentValue(sentiment);
    // Map value (0-100) to rotation (-90 to 90 degrees)
    const rotation = (value / 100) * 180 - 90;

    const getSentimentLabel = (value: number) => {
        if (value > 75) return "Muito Otimista";
        if (value > 60) return "Otimista";
        if (value > 40) return "Neutro";
        if (value > 25) return "Pessimista";
        return "Muito Pessimista";
    };
    
    const label = getSentimentLabel(value);

    return (
        <div className="my-3 flex flex-col items-center" aria-label={`Medidor de sentimento: ${label}`}>
            <div className="relative w-full max-w-[200px] h-[100px] overflow-hidden">
                {/* Gauge background arc */}
                <div className="absolute top-0 left-0 w-full h-[200px] rounded-t-full bg-gradient-to-r from-red-accent via-yellow-400 to-green-accent"></div>
                {/* Gauge inner mask */}
                <div className="absolute top-2 left-2 w-[calc(100%-16px)] h-[192px] ml-2 mt-0 rounded-t-full bg-bunker"></div>
                
                {/* Pointer */}
                <div
                    className="absolute bottom-0 left-1/2 w-0.5 h-[90px] bg-spindle origin-bottom transition-transform duration-700 ease-out"
                    style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
                >
                     <div className="w-2 h-2 bg-spindle rounded-full absolute -top-1 -left-[3px]"></div>
                </div>
                {/* Pointer base */}
                 <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-spindle rounded-full transform -translate-x-1/2 translate-y-1/2 border-2 border-bunker"></div>
            </div>
             <div className="flex justify-between w-full max-w-[200px] text-xs text-nevada px-1 -mt-2">
                <span>Bearish</span>
                <span className="font-bold text-spindle -mt-4">{label}</span>
                <span>Bullish</span>
            </div>
        </div>
    );
};

export default SentimentGauge;
