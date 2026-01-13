
export type Language = 'en' | 'ko';
export type Currency = 'USD' | 'KRW';

export interface StockHolding {
  id: string;
  ticker: string;
  name: string;
  shares: number;
  avgPrice: number; // In USD
  currentPrice: number; // In USD
  dividendPerShare: number; // Annual, In USD
  dividendYield: number;
  frequency: 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual';
  purchaseDate: string;
  exchangeRateAtPurchase: number; // USD to KRW rate at purchase
  lastUpdated: string;
}

export interface MonthlyDividend {
  month: string;
  amount: number;
}

export interface DividendInsight {
  summary: string;
  safetyScore: number; // 1-10 (10 being safest)
  growthPotential: string;
}
