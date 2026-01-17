import { StockMetric } from './types';

export const SECTORS = [
  'Technology', 'Healthcare', 'Financial Services', 
  'Consumer Cyclical', 'Industrials', 'Energy', 
  'Communication Services', 'Utilities', 'Basic Materials', 'Consumer Defensive'
];

export const COUNTRIES = [
  'USA', 'Canada', 'UK', 'Germany', 'France', 'Italy', 'Japan',
  'Australia', 'South Korea', 'Switzerland', 'Netherlands', 'Sweden',
  'Denmark', 'Norway', 'Spain', 'India', 'Brazil', 'Peru', 'Chile', 'Mexico'
];

export const SAMPLE_TOP_STOCKS: StockMetric[] = [
  // G7 - USA
  { ticker: 'AAPL', name: 'Apple Inc.', country: 'USA', sector: 'Technology', price: 235.45, marketCap: 3500, peRatio: 32.1, pbRatio: 48.2, roe: 154.3, dividendYield: 0.45, debtToEquity: 1.4, revenueGrowth3Yr: 8.5, roic: 55.2, fcfYield: 3.2 },
  { ticker: 'MSFT', name: 'Microsoft Corp.', country: 'USA', sector: 'Technology', price: 420.21, marketCap: 3100, peRatio: 35.4, pbRatio: 12.8, roe: 38.5, dividendYield: 0.72, debtToEquity: 0.2, revenueGrowth3Yr: 14.2, roic: 32.1, fcfYield: 2.8 },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', country: 'USA', sector: 'Technology', price: 132.89, marketCap: 3200, peRatio: 72.5, pbRatio: 58.1, roe: 115.6, dividendYield: 0.03, debtToEquity: 0.1, revenueGrowth3Yr: 95.2, roic: 82.4, fcfYield: 4.1 },
  
  // G7 - UK, GERMANY, FRANCE, ITALY, JAPAN, CANADA
  { ticker: 'AZN.L', name: 'AstraZeneca', country: 'UK', sector: 'Healthcare', price: 122.50, marketCap: 190, peRatio: 34.1, pbRatio: 4.5, roe: 16.2, dividendYield: 2.1, debtToEquity: 0.7, revenueGrowth3Yr: 15.2, roic: 13.5, fcfYield: 3.8 },
  { ticker: 'SAP', name: 'SAP SE', country: 'Germany', sector: 'Technology', price: 215.30, marketCap: 250, peRatio: 38.2, pbRatio: 5.4, roe: 14.5, dividendYield: 1.2, debtToEquity: 0.3, revenueGrowth3Yr: 9.1, roic: 12.8, fcfYield: 5.2 },
  { ticker: 'MC.PA', name: 'LVMH', country: 'France', sector: 'Consumer Cyclical', price: 685.12, marketCap: 345, peRatio: 22.8, pbRatio: 6.1, roe: 24.2, dividendYield: 1.8, debtToEquity: 0.5, revenueGrowth3Yr: 12.5, roic: 18.2, fcfYield: 4.5 },
  { ticker: 'RACE', name: 'Ferrari N.V.', country: 'Italy', sector: 'Consumer Cyclical', price: 430.20, marketCap: 82, peRatio: 52.4, pbRatio: 14.2, roe: 42.1, dividendYield: 0.6, debtToEquity: 0.8, revenueGrowth3Yr: 16.8, roic: 22.5, fcfYield: 3.1 },
  { ticker: '7203.T', name: 'Toyota Motor', country: 'Japan', sector: 'Consumer Cyclical', price: 18.40, marketCap: 280, peRatio: 9.8, pbRatio: 1.1, roe: 13.5, dividendYield: 2.8, debtToEquity: 1.1, revenueGrowth3Yr: 15.4, roic: 8.2, fcfYield: 6.5 },
  { ticker: 'RY', name: 'Royal Bank of Canada', country: 'Canada', sector: 'Financial Services', price: 165.20, marketCap: 235, peRatio: 13.8, pbRatio: 1.8, roe: 15.4, dividendYield: 3.4, debtToEquity: 0.9, revenueGrowth3Yr: 6.2, roic: 11.5, fcfYield: 8.2 },

  // OTHER OECD NODES
  { ticker: 'NOVO-B.CO', name: 'Novo Nordisk', country: 'Denmark', sector: 'Healthcare', price: 740.20, marketCap: 560, peRatio: 44.5, pbRatio: 32.4, roe: 88.2, dividendYield: 1.1, debtToEquity: 0.2, revenueGrowth3Yr: 28.5, roic: 52.1, fcfYield: 2.4 },
  { ticker: 'ASML', name: 'ASML Holding', country: 'Netherlands', sector: 'Technology', price: 780.45, marketCap: 310, peRatio: 42.1, pbRatio: 22.4, roe: 52.8, dividendYield: 0.85, debtToEquity: 0.4, revenueGrowth3Yr: 18.2, roic: 35.6, fcfYield: 2.5 },
  { ticker: 'NESN.SW', name: 'Nestlé S.A.', country: 'Switzerland', sector: 'Consumer Defensive', price: 82.40, marketCap: 220, peRatio: 18.5, pbRatio: 5.8, roe: 19.4, dividendYield: 3.5, debtToEquity: 1.2, revenueGrowth3Yr: 4.2, roic: 14.1, fcfYield: 5.5 },
  { ticker: 'BHP.AX', name: 'BHP Group', country: 'Australia', sector: 'Basic Materials', price: 44.20, marketCap: 145, peRatio: 12.1, pbRatio: 3.2, roe: 28.5, dividendYield: 5.8, debtToEquity: 0.4, revenueGrowth3Yr: 8.2, roic: 19.4, fcfYield: 9.5 },
  { ticker: 'ITX.MC', name: 'Inditex', country: 'Spain', sector: 'Consumer Cyclical', price: 48.50, marketCap: 152, peRatio: 22.4, pbRatio: 6.8, roe: 31.2, dividendYield: 2.6, debtToEquity: 0.1, revenueGrowth3Yr: 14.2, roic: 28.1, fcfYield: 5.4 },
  { ticker: 'ATCO-A.ST', name: 'Atlas Copco', country: 'Sweden', sector: 'Industrials', price: 182.40, marketCap: 85, peRatio: 28.5, pbRatio: 9.4, roe: 32.8, dividendYield: 1.5, debtToEquity: 0.3, revenueGrowth3Yr: 12.5, roic: 24.8, fcfYield: 4.8 },

  // EMERGING MARKETS (INDIA, BRAZIL, MEXICO, CHILE, PERU)
  { ticker: 'RELIANCE.NS', name: 'Reliance Industries', country: 'India', sector: 'Energy', price: 2985.40, marketCap: 210, peRatio: 28.4, pbRatio: 2.5, roe: 9.4, dividendYield: 0.35, debtToEquity: 0.4, revenueGrowth3Yr: 12.1, roic: 10.5, fcfYield: 2.1 },
  { ticker: 'HDB', name: 'HDFC Bank', country: 'India', sector: 'Financial Services', price: 68.20, marketCap: 155, peRatio: 18.4, pbRatio: 2.8, roe: 17.2, dividendYield: 1.1, debtToEquity: 0.1, revenueGrowth3Yr: 18.4, roic: 14.2, fcfYield: 0.0 },
  { ticker: 'VALE', name: 'Vale S.A.', country: 'Brazil', sector: 'Basic Materials', price: 12.45, marketCap: 55, peRatio: 5.8, pbRatio: 1.2, roe: 22.4, dividendYield: 8.4, debtToEquity: 0.6, revenueGrowth3Yr: -2.5, roic: 18.2, fcfYield: 12.5 },
  { ticker: 'PBR', name: 'Petrobras', country: 'Brazil', sector: 'Energy', price: 14.80, marketCap: 98, peRatio: 4.2, pbRatio: 1.1, roe: 28.4, dividendYield: 12.5, debtToEquity: 0.8, revenueGrowth3Yr: 10.2, roic: 15.4, fcfYield: 18.2 },
  { ticker: 'AMX', name: 'América Móvil', country: 'Mexico', sector: 'Communication Services', price: 15.40, marketCap: 48, peRatio: 12.4, pbRatio: 1.9, roe: 14.8, dividendYield: 3.2, debtToEquity: 1.1, revenueGrowth3Yr: 4.5, roic: 9.8, fcfYield: 7.2 },
  { ticker: 'WALMEX.MX', name: 'Walmart de México', country: 'Mexico', sector: 'Consumer Defensive', price: 68.40, marketCap: 58, peRatio: 24.1, pbRatio: 5.2, roe: 22.4, dividendYield: 2.8, debtToEquity: 0.1, revenueGrowth3Yr: 9.2, roic: 18.5, fcfYield: 5.1 },
  { ticker: 'SQM', name: 'Sociedad Química y Minera', country: 'Chile', sector: 'Basic Materials', price: 38.20, marketCap: 11, peRatio: 9.2, pbRatio: 1.8, roe: 45.1, dividendYield: 5.2, debtToEquity: 0.5, revenueGrowth3Yr: 42.1, roic: 28.4, fcfYield: 9.1 },
  { ticker: 'BAP', name: 'Credicorp Ltd.', country: 'Peru', sector: 'Financial Services', price: 155.30, marketCap: 12, peRatio: 10.1, pbRatio: 1.4, roe: 15.2, dividendYield: 4.1, debtToEquity: 0.0, revenueGrowth3Yr: 8.4, roic: 12.1, fcfYield: 4.5 },
];