export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HeikinAshiCandle {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    isGreen: boolean;
}

export interface VwapPeriodValue {
  current: number;
  previous: number;
}

export interface VwapData {
  daily: VwapPeriodValue;
  weekly: VwapPeriodValue;
  monthly: VwapPeriodValue;
  annual: VwapPeriodValue;
}

export interface VwapBands {
    upper: number;
    middle: number;
    lower: number;
}

export interface PivotPoints {
    pivot: number;
    s1: number;
    s2: number;
    s3: number;
    r1: number;
    r2: number;
    r3: number;
}

export type Signal = 'COMPRA' | 'VENDA' | 'MANTER' | 'NEUTRO' | 'RETRAÇÃO' | 'ROMPIMENTO';

export interface SignalDetails {
    signal: Signal;
    entry: number;
    stopLoss: number;
    takeProfit: number;
    reasons: string[];
}
// FIX: Add missing AnalysisResult and SuggestedOrder types used in geminiService.ts.
export interface SuggestedOrder {
  type: string;
  price: number;
  takeProfit: number;
  stopLoss: number;
  reason: string;
}

export interface AnalysisResult {
  sentiment: string;
  buyOrders: SuggestedOrder[];
  // FIX: Corrected typo from 'Suggested-Order' to 'SuggestedOrder'.
  sellOrders: SuggestedOrder[];
}