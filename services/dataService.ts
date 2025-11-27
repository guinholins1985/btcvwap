import type { Candle } from '../types';

const INITIAL_REFERENCE_PRICE = 95734.0; // Define um preço de referência consistente para a simulação

// Mock data to simulate historical market data from a realistic current price, making the app self-contained.
// This simulates data as if the current price on Investing.com is around $95,734.
// Generates 400 days of hourly data by working backwards from a recent price point.
const mockCandleData: Candle[] = (() => {
  const data: Candle[] = [];
  const totalHours = 400 * 24;
  let price = INITIAL_REFERENCE_PRICE; // Usa o preço de referência consistente
  const now = new Date();

  for (let i = 0; i < totalHours; i++) {
    const date = new Date(now);
    date.setUTCHours(now.getUTCHours() - i);
    
    const close = price;
    const fluctuation = (Math.random() - 0.49) * 600; // Volatilidade para velas H1
    const open = close - fluctuation;
    const high = Math.max(open, close) + Math.random() * 150;
    const low = Math.min(open, close) - Math.random() * 150;
    const volume = 50 + Math.random() * 100;
    
    price = open; // O fechamento da vela anterior é a abertura da vela atual na geração regressiva

    data.push({
      date: date.toISOString(),
      open: parseFloat(open.toFixed(3)),
      high: parseFloat(high.toFixed(3)),
      low: parseFloat(low.toFixed(3)),
      close: parseFloat(close.toFixed(3)),
      volume: parseFloat(volume.toFixed(3)),
    });
  }
  return data.reverse(); // Inverte o array para que os dados mais antigos venham primeiro
})();


/**
 * Fetches historical OHLCV data for BTC/USD from a local mock source.
 * The data is simulated to reflect realistic market prices.
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


let lastPrice = mockCandleData.length > 0 ? mockCandleData[mockCandleData.length - 1].close : INITIAL_REFERENCE_PRICE;
/**
 * Simulates fetching the current price for BTC/USD.
 * @returns A promise that resolves to the current price as a number.
 */
export const fetchCurrentPrice = async (): Promise<number> => {
    try {
        // Tenta extrair o preço do Investing.com
        // ATENÇÃO: A extração direta de sites externos via `fetch` em um ambiente frontend (navegador)
        // é frequentemente bloqueada pela política de segurança CORS (Cross-Origin Resource Sharing).
        // Isso significa que, na prática, este código pode falhar na maioria dos navegadores,
        // e o fallback para o preço simulado será ativado. Para uma extração confiável,
        // um servidor de backend (proxy) seria necessário.
        const response = await fetch('https://br.investing.com/crypto/bitcoin/chart', {
            // Estes cabeçalhos podem ajudar a se parecer mais com uma requisição de navegador,
            // mas não superam as restrições de CORS.
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Tentativa de encontrar o preço com seletores mais robustos.
        // Estes seletores podem precisar de ajuste dependendo da estrutura HTML atual do Investing.com e podem ser instáveis.
        const priceElement = doc.querySelector('[data-test="instrument-price-last"]') || // Comum em páginas de instrumentos
                             doc.querySelector('.key-value-details__value') || // Outro padrão comum para valores chave
                             doc.querySelector('[data-test="last-price"]') || 
                             doc.querySelector('.last-price') || 
                             doc.querySelector('.js-last-price') ||
                             doc.querySelector('.main-price-value') || // Tentativa mais genérica
                             doc.querySelector('.tv-symbol-price-quote__value') || // Selector for TradingView widget prices, sometimes integrated
                             doc.querySelector('.text-2xl.font-bold.leading-7.md\\:text-3xl'); // Novo seletor com base em classes específicas

        if (priceElement && priceElement.textContent) {
            const priceString = priceElement.textContent.trim();
            // Remove pontos (milhares) e substitui vírgula (decimal) por ponto para parseFloat
            const cleanedPriceString = priceString.replace(/\./g, '').replace(',', '.');
            const parsedPrice = parseFloat(cleanedPriceString);

            if (!isNaN(parsedPrice) && parsedPrice > 0) {
                lastPrice = parsedPrice; // Atualiza o lastPrice com o valor real
                console.log(`Preço extraído do Investing.com: $${lastPrice.toFixed(3)}`);
                return Promise.resolve(parseFloat(lastPrice.toFixed(3)));
            }
        }
        throw new Error("Price element not found or could not be parsed from Investing.com HTML.");

    } catch (error) {
        console.warn("Falha ao extrair preço do Investing.com. Usando preço simulado.", error);
        // Fallback para simulação de preço se a extração falhar (ex: CORS, elemento não encontrado, erro HTTP)
    }

    // Lógica de simulação de preço como fallback, aprimorada para maior coerência
    const maxFluctuation = 100; // Flutua em até +/- $100 por intervalo (mais volátil para BTC)
    const fluctuation = (Math.random() - 0.5) * maxFluctuation; 
    
    let newPrice = lastPrice + fluctuation;

    // Aumenta a força de reversão para puxar o preço de volta para o preço de referência inicial.
    // Isso deve combater drifts maiores e manter a coerência geral com o ponto de partida.
    const deviation = newPrice - INITIAL_REFERENCE_PRICE;
    const reversionFactor = 0.01; // Dobra o fator de reversão para maior "ancoragem"
    newPrice -= deviation * reversionFactor; 

    // Limites para evitar preços absurdos na simulação, mantendo-o próximo ao preço inicial
    lastPrice = Math.max(INITIAL_REFERENCE_PRICE * 0.9, newPrice); // Não ir muito abaixo de 90% do inicial
    lastPrice = Math.min(INITIAL_REFERENCE_PRICE * 1.1, lastPrice); // Não ir muito acima de 110% do inicial

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