import type { Candle, HeikinAshiCandle, PivotPoints } from '../types';

export const calculateRSI = (candles: Candle[], period: number = 14): number => {
    if (candles.length < period + 1) return 50;

    const priceChanges = candles.map((c, i) => i > 0 ? c.close - candles[i-1].close : 0).slice(1);
    
    let gains = 0;
    let losses = 0;

    for (let i = 0; i < period; i++) {
        if (priceChanges[i] > 0) {
            gains += priceChanges[i];
        } else {
            losses -= priceChanges[i];
        }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period; i < priceChanges.length; i++) {
        const change = priceChanges[i];
        avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
        avgLoss = (avgLoss * (period - 1) + (change < 0 ? -change : 0)) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
};

export const calculateHeikinAshi = (candles: Candle[]): HeikinAshiCandle[] => {
    if (candles.length === 0) return [];

    const haCandles: HeikinAshiCandle[] = [];
    
    const firstCandle = candles[0];
    haCandles.push({
        date: firstCandle.date,
        open: (firstCandle.open + firstCandle.close) / 2,
        close: (firstCandle.open + firstCandle.high + firstCandle.low + firstCandle.close) / 4,
        high: firstCandle.high,
        low: firstCandle.low,
        isGreen: (firstCandle.open + firstCandle.high + firstCandle.low + firstCandle.close) / 4 >= (firstCandle.open + firstCandle.close) / 2,
    });
    
    for (let i = 1; i < candles.length; i++) {
        const prevHa = haCandles[i-1];
        const current = candles[i];
        
        const haClose = (current.open + current.high + current.low + current.close) / 4;
        const haOpen = (prevHa.open + prevHa.close) / 2;
        const haHigh = Math.max(current.high, haOpen, haClose);
        const haLow = Math.min(current.low, haOpen, haClose);

        haCandles.push({
            date: current.date,
            open: haOpen,
            close: haClose,
            high: haHigh,
            low: haLow,
            isGreen: haClose >= haOpen,
        });
    }

    return haCandles;
};


export const calculateVwap = (data: Candle[], startDate: Date, endDate: Date): number => {
  let cumulativePV = 0;
  let cumulativeVolume = 0;
  
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  for (const candle of data) {
    const candleTime = new Date(candle.date).getTime();
    if (candleTime >= startTime && candleTime < endTime) {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;
      cumulativePV += typicalPrice * candle.volume;
      cumulativeVolume += candle.volume;
    }
  }

  return cumulativeVolume > 0 ? cumulativePV / cumulativeVolume : 0;
};


export const calculatePivotPoints = (prevDay: Candle): PivotPoints => {
    const P = (prevDay.high + prevDay.low + prevDay.close) / 3;
    const R1 = (2 * P) - prevDay.low;
    const S1 = (2 * P) - prevDay.high;
    const R2 = P + (prevDay.high - prevDay.low);
    const S2 = P - (prevDay.high - prevDay.low);
    const R3 = prevDay.high + 2 * (P - prevDay.low);
    const S3 = prevDay.low - 2 * (prevDay.high - P);

    return { pivot: P, s1: S1, s2: S2, s3: S3, r1: R1, r2: R2, r3: R3 };
};