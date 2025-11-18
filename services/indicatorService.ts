import type { Candle, HeikinAshiCandle, PivotPoints, FibonacciLevels } from '../types';

export const calculateRSI = (candles: Candle[], period: number = 14): number => {
    if (candles.length < period + 1) return 50;

    const priceChanges = candles.map((c, i) => i > 0 ? c.close - candles[i-1].close : 0).slice(1);
    
    let gains = 0;
    let losses = 0;

    // Use latest data for calculation
    const relevantChanges = priceChanges.slice(priceChanges.length - (candles.length - 1));

    for (let i = 0; i < period; i++) {
        if (relevantChanges[i] > 0) {
            gains += relevantChanges[i];
        } else {
            losses -= relevantChanges[i];
        }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period; i < relevantChanges.length; i++) {
        const change = relevantChanges[i];
        avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
        avgLoss = (avgLoss * (period - 1) + (change < 0 ? -change : 0)) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
};

export const calculateEMASeries = (candles: Candle[], period: number): (number | null)[] => {
    if (candles.length < period) return candles.map(() => null);

    const emas: (number | null)[] = Array(candles.length).fill(null);
    const multiplier = 2 / (period + 1);
    
    let sma = 0;
    for (let i = 0; i < period; i++) {
        sma += candles[i].close;
    }
    emas[period - 1] = sma / period;

    for (let i = period; i < candles.length; i++) {
        const close = candles[i].close;
        const prevEma = emas[i-1];
        if (prevEma !== null) {
            emas[i] = (close - prevEma) * multiplier + prevEma;
        }
    }

    return emas;
};

export const calculateEMA = (candles: Candle[], period: number): number => {
    if (candles.length < period) return 0;
    
    const multiplier = 2 / (period + 1);
    
    // Slice for a more stable calculation, but not the entire history for performance
    const relevantCandles = candles.length > period * 3 ? candles.slice(-period * 3) : candles;

    let sma = 0;
    for (let i = 0; i < period; i++) {
        sma += relevantCandles[i].close;
    }
    let ema = sma / period;

    for (let i = period; i < relevantCandles.length; i++) {
        ema = (relevantCandles[i].close - ema) * multiplier + ema;
    }
    
    return ema;
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

export const calculateFibonacciLevels = (candles: Candle[], period: number = 90): FibonacciLevels | null => {
    const daysInCandles = Math.floor(candles.length / 24);
    if (daysInCandles < period) return null;

    const relevantCandles = candles.slice(-period * 24); // Look at last 90 days of hourly data
    
    let swingHigh = -Infinity;
    let swingLow = Infinity;
    let highIndex = -1;
    let lowIndex = -1;

    relevantCandles.forEach((c, index) => {
        if (c.high > swingHigh) {
            swingHigh = c.high;
            highIndex = index;
        }
        if (c.low < swingLow) {
            swingLow = c.low;
            lowIndex = index;
        }
    });

    if (swingHigh === -Infinity || swingLow === Infinity || highIndex === -1 || lowIndex === -1) return null;

    const isUptrend = highIndex > lowIndex;
    const range = swingHigh - swingLow;

    const fibRatios = [0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.618, 2.0];
    
    const levels: { [level: string]: number } = {};

    if (isUptrend) {
        fibRatios.forEach(ratio => {
            const levelValue = ratio <= 1 ? swingHigh - (range * ratio) : swingHigh + (range * (ratio - 1));
            levels[`${(ratio * 100).toFixed(0)}%`] = levelValue;
        });
    } else { // Downtrend
         fibRatios.forEach(ratio => {
            const levelValue = ratio <= 1 ? swingLow + (range * ratio) : swingLow - (range * (ratio - 1));
            levels[`${(ratio * 100).toFixed(0)}%`] = levelValue;
        });
    }

    return { swingHigh, swingLow, isUptrend, levels };
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