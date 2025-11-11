import type { Candle } from '../types';

// Mock data to simulate historical market data, making the app self-contained.
const mockCandleData: Candle[] = Array.from({ length: 200 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (200 - i));
  const open = 104000 + Math.sin(i / 20) * 2000 + (Math.random() - 0.5) * 500;
  const close = open + (Math.random() - 0.5) * 800;
  const high = Math.max(open, close) + Math.random() * 300;
  const low = Math.min(open, close) - Math.random() * 300;
  const volume = 1000 + Math.random() * 1500;
  return {
    date: date.toISOString().split('T')[0],
    open: parseFloat(open.toFixed(2)),
    high: parseFloat(high.toFixed(2)),
    low: parseFloat(low.toFixed(2)),
    close: parseFloat(close.toFixed(2)),
    volume: parseFloat(volume.toFixed(2)),
  };
});

/**
 * Fetches historical OHLCV data for BTC/USD from a local mock source.
 * @param _days The number of days of historical data to fetch (parameter ignored).
 * @returns A promise that resolves to an array of Candle objects.
 */
export const fetchMarketData = async (_days: number): Promise<Candle[]> => {
  // Returns a copy of the mock data to prevent mutation.
  return Promise.resolve([...mockCandleData]);
};


let lastPrice = mockCandleData[mockCandleData.length - 1].close;
/**
 * Simulates fetching the current price for BTC/USD.
 * @returns A promise that resolves to the current price as a number.
 */
export const fetchCurrentPrice = async (): Promise<number> => {
    // Simulate small price fluctuations to mimic a live market.
    const fluctuation = (Math.random() - 0.5) * 150; // Fluctuate by up to $75
    lastPrice = Math.max(90000, lastPrice + fluctuation); // Ensure price doesn't go too low
    return Promise.resolve(parseFloat(lastPrice.toFixed(2)));
}

/**
 * Fetches the current USD to BRL exchange rate from a local mock source.
 * @returns A promise that resolves to a static rate as a number.
 */
export const fetchUsdBrlRate = async (): Promise<number> => {
  // Using a static, realistic exchange rate.
  return Promise.resolve(5.45);
}