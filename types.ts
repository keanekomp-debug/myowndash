
export enum CountryGroup {
  G7 = 'G7',
  OECD = 'OECD',
  EMERGING = 'EMERGING',
  ALL = 'ALL'
}

export interface StockMetric {
  ticker: string;
  name: string;
  country: string;
  sector: string;
  price: number;
  marketCap: number; // in Billions
  peRatio: number;
  pbRatio: number;
  roe: number;
  dividendYield: number;
  debtToEquity: number;
  revenueGrowth3Yr: number;
  roic: number;
  fcfYield: number;
}

export interface NewsItem {
  headline: string;
  source: string;
  url: string;
  time: string;
  summary: string;
}

export interface PriorityStock extends StockMetric {
  recommendedBy: string[];
  thesisSnippet: string;
}

export interface StockAnalysis {
  summary: string;
  valuation: 'Under' | 'Fair' | 'Over';
  riskScore: number; // 1-10
  investmentThesis: string[];
  risks: string[];
}

export interface ScreenerFilter {
  countryGroup: CountryGroup;
  minMarketCap: number;
  maxPE: number;
  minROE: number;
  sector: string;
}
