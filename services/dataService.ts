import type { Candle } from '../types';

/**
 * Fetches historical OHLCV data for BTC/USD.
 * @param days The number of days of historical data to fetch.
 * @returns A promise that resolves to an array of Candle objects.
 */
export const fetchMarketData = async (days: number): Promise<Candle[]> => {
  const url = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&limit=${days}&aggregate=1`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CryptoCompare API request failed with status ${response.status}`);
    }
    const apiResponse = await response.json();

    if (apiResponse.Response !== 'Success' || !apiResponse.Data?.Data) {
      throw new Error('Invalid response from CryptoCompare API');
    }

    const marketData: Candle[] = apiResponse.Data.Data.map((d: any) => ({
      date: new Date(d.time * 1000).toISOString().split('T')[0],
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volumefrom, // volume in BTC
    }));

    return marketData;
  } catch (error) {
    console.error("Failed to fetch market data:", error);
    throw error;
  }
};

/**
 * Fetches the current price for BTC/USD.
 * @returns A promise that resolves to the current price as a number.
 */
export const fetchCurrentPrice = async (): Promise<number> => {
  const url = `https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CryptoCompare price API request failed with status ${response.status}`);
    }
    const data = await response.json();
    if (!data.USD) {
       throw new Error('Invalid price response from CryptoCompare API');
    }
    return data.USD;
  } catch(error) {
    console.error("Failed to fetch current price:", error);
    throw error;
  }
}
