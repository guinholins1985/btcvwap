import type { Candle } from '../types';

// Mock data to simulate historical market data, making the app self-contained.
// Generates 400 days of hourly data.
const mockCandleData: Candle[] = (() => {
  const data: Candle[] = [];
  const totalHours = 400 * 24;
  let price = 65000;
  const startDate = new Date();

  for (let i = 0; i < totalHours; i++) {
    const date = new Date(startDate);
    date.setUTCHours(date.getUTCHours() - (totalHours - i));
    
    const open = price;
    const fluctuation = (Math.random() - 0.49) * 400; // More frequent but smaller moves for H1
    const close = open + fluctuation;
    const high = Math.max(open, close) + Math.random() * 100;
    const low = Math.min(open, close) - Math.random() * 100;
    const volume = 50 + Math.random() * 100;
    
    price = close; // Next candle opens at previous close

    data.push({
      date: date.toISOString(),
      open: parseFloat(open.toFixed(3)),
      high: parseFloat(high.toFixed(3)),
      low: parseFloat(low.toFixed(3)),
      close: parseFloat(close.toFixed(3)),
      volume: parseFloat(volume.toFixed(3)),
    });
  }
  return data;
})();


/**
 * Fetches historical OHLCV data for BTC/USD from a local mock source.
 * @param days The number of days of historical data to fetch.
 * @returns A promise that resolves to an array of Candle objects (hourly).
 */
export const fetchMarketData = async (days: number): Promise<Candle[]> => {
  const hours = days * 24;
  if (hours > mockCandleData.length) {
      return Promise.resolve([...mockCandleData]);
  }
  // Return the most recent `hours` worth of data.
  return Promise.resolve(mockCandleData.slice(-hours));
};


let lastPrice = mockCandleData.length > 0 ? mockCandleData[mockCandleData.length - 1].close : 65000;
/**
 * Simulates fetching the current price for BTC/USD.
 * @returns A promise that resolves to the current price as a number.
 */
export const fetchCurrentPrice = async (): Promise<number> => {
    // Simulate small price fluctuations to mimic a live market.
    const fluctuation = (Math.random() - 0.5) * 10; // Fluctuate by up to $10, suitable for H1 with more precision
    lastPrice = Math.max(50000, lastPrice + fluctuation); // Ensure price doesn't go too low
    return Promise.resolve(parseFloat(lastPrice.toFixed(3)));
}

/**
 * Fetches the current USD to BRL exchange rate from a local mock source.
 * @returns A promise that resolves to a static rate as a number.
 */
export const fetchUsdBrlRate = async (): Promise<number> => {
  // Using a static, realistic exchange rate.
  return Promise.resolve(5.45);
}
