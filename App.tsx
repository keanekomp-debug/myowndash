
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, TrendingUp, Globe, Filter, Activity, ArrowUpRight, ArrowDownRight,
  ChevronRight, Loader2, Briefcase, Download, Newspaper, Star, 
  ExternalLink, ShieldCheck, Database, RefreshCcw, Sun, Moon,
  ArrowUpDown, ArrowUp, ArrowDown, ExternalLink as YahooIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

import { StockMetric, CountryGroup, ScreenerFilter, StockAnalysis, NewsItem, PriorityStock } from './types';
import { SECTORS, COUNTRIES, SAMPLE_TOP_STOCKS, getYahooUrl } from './constants';
import { getInstitutionalInsights, analyzeStock, generateHistoricalData } from './geminiService';

type SortConfig = {
  key: keyof StockMetric;
  direction: 'ascending' | 'descending';
} | null;

const App: React.FC = () => {
  const [stocks, setStocks] = useState<StockMetric[]>(SAMPLE_TOP_STOCKS);
  const [selectedStock, setSelectedStock] = useState<StockMetric | null>(null);
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [marketSummary, setMarketSummary] = useState<string>('');
  const [priorityStocks, setPriorityStocks] = useState<PriorityStock[]>([]);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);
  const [groundingSources, setGroundingSources] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<'screener' | 'news'>('screener');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'marketCap', direction: 'descending' });
  const [filters, setFilters] = useState<ScreenerFilter>({
    countryGroup: CountryGroup.ALL,
    minMarketCap: 0,
    maxPE: 500,
    minROE: -100,
    sector: 'All'
  });

  useEffect(() => {
    refreshIntelligence(); 
  }, []);

  const refreshIntelligence = async () => {
    setIsRefreshing(true);
    try {
      const data = await getInstitutionalInsights();
      if (data) {
        setMarketSummary(data.marketSummary);
        setPriorityStocks(data.priorityStocks);
        setNewsFeed(data.newsFeed);
        setGroundingSources(data.groundingChunks || []);
      }
    } catch (err) {
      console.warn("AI Sync unavailable - running in deterministic mode.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const requestSort = (key: keyof StockMetric) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedStocks = useMemo(() => {
    let sortableStocks = [...stocks];
    if (sortConfig !== null) {
      sortableStocks.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableStocks;
  }, [stocks, sortConfig]);

  const filteredStocks = useMemo(() => {
    return sortedStocks.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.ticker.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSector = filters.sector === 'All' || s.sector === filters.sector;
      const matchesPE = s.peRatio <= filters.maxPE || s.peRatio < 0; // Handle negative PE for growth
      const matchesROE = s.roe >= filters.minROE;
      const matchesCap = s.marketCap >= filters.minMarketCap;
      
      let matchesRegion = true;
      const g7Countries = ['USA', 'Canada', 'UK', 'Germany', 'France', 'Italy', 'Japan'];
      const emergingCountries = ['India', 'Brazil', 'Peru', 'Chile', 'Mexico'];
      
      if (filters.countryGroup === CountryGroup.G7) {
        matchesRegion = g7Countries.includes(s.country);
      } else if (filters.countryGroup === CountryGroup.EMERGING) {
        matchesRegion = emergingCountries.includes(s.country);
      } else if (filters.countryGroup === CountryGroup.OECD) {
        matchesRegion = !emergingCountries.includes(s.country);
      }
      
      return matchesSearch && matchesSector && matchesPE && matchesROE && matchesCap && matchesRegion;
    });
  }, [sortedStocks, searchQuery, filters]);

  const exportToCSV = () => {
    const headers = ["Ticker", "Name", "Country", "Sector", "Price", "Market Cap", "P/E", "ROE", "ROIC", "FCF Yield", "Cash On Hand"];
    const rows = filteredStocks.map(s => [s.ticker, s.name, s.country, s.sector, s.price, s.marketCap, s.peRatio, s.roe, s.roic, s.fcfYield, s.cashOnHand]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `QuantEdge_EOD_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStockClick = async (stock: StockMetric, e: React.MouseEvent) => {
    // If user clicks on the row but not the Yahoo icon, select for details
    setSelectedStock(stock);
    setLoadingAnalysis(true);
    setAnalysis(null);
    try {
      const result = await analyzeStock(stock);
      setAnalysis(result);
    } catch (err) {
      console.error("Analysis node failed.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const openYahoo = (ticker: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(getYahooUrl(ticker), '_blank');
  };

  const getSortIcon = (key: keyof StockMetric) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 opacity-20" />;
    return sortConfig.direction === 'ascending' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const colorModeClass = isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900';
  const borderClass = isDarkMode ? 'border-slate-800' : 'border-slate-200';
  const tableRowClass = isDarkMode ? 'bg-slate-900/20 hover:bg-slate-800/60' : 'bg-white hover:bg-slate-100 shadow-sm';

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-300 ${colorModeClass}`}>
      {/* Navbar */}
      <nav className={`sticky top-0 z-50 border-b ${borderClass} ${isDarkMode ? 'bg-slate-950/95' : 'bg-white/95'} backdrop-blur-xl px-6 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-4">
          <div className="bg-emerald-600 p-2 rounded-lg shadow-lg shadow-emerald-900/20">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <span className={`text-xl font-black tracking-tighter block leading-none italic uppercase ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>QuantEdge High-Conviction</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 uppercase tracking-[0.2em] animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> System Live
              </span>
              <span className={`text-[10px] font-mono flex items-center gap-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                EOD SYNC: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-8 relative group">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
          <input 
            type="text" 
            placeholder="Search symbols (e.g. RACE, RELIANCE, NOVO)..." 
            className={`w-full border rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-sm ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-slate-200'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={exportToCSV} className={`flex items-center gap-2 border px-4 py-2 rounded-lg text-xs font-bold transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-100'}`}>
            <Download className="w-3 h-3" /> Export CSV
          </button>
          <button 
            onClick={refreshIntelligence}
            className={`flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-500 px-4 py-2 rounded-lg text-xs font-black transition-all shadow-lg ${isRefreshing ? 'opacity-50' : ''}`}
            disabled={isRefreshing}
          >
            {isRefreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
            SCAN MACRO
          </button>
        </div>
      </nav>

      {/* Primary Tabs */}
      <div className={`px-6 pt-3 flex items-center gap-4 border-b ${borderClass}`}>
        <button 
          onClick={() => setActiveTab('screener')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'screener' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          Global Quant Screener
        </button>
        <button 
          onClick={() => setActiveTab('news')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'news' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          Institutional Macro Feed
        </button>
      </div>

      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'screener' ? (
          <>
            {/* Left Sidebar - Conviction Signals */}
            <aside className={`w-[360px] border-r ${borderClass} flex flex-col hidden 2xl:flex ${isDarkMode ? 'bg-slate-950/50' : 'bg-white'}`}>
              <div className={`p-5 border-b ${borderClass} flex-1 overflow-y-auto custom-scrollbar`}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Priority Alpha Thesis</h3>
                  </div>
                </div>
                <div className="space-y-4">
                  {isRefreshing ? Array(6).fill(0).map((_,i) => (
                    <div key={i} className={`h-36 rounded-xl animate-pulse ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-200'}`} />
                  )) : priorityStocks.map((ps, i) => (
                    <div key={i} onClick={(e) => openYahoo(ps.ticker, e)} className={`p-4 rounded-xl border transition-all group cursor-pointer shadow-sm relative overflow-hidden ${isDarkMode ? 'bg-slate-900/30 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50' : 'bg-white border-slate-200 hover:border-emerald-500/50 hover:bg-slate-50'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`font-black text-sm mono tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{ps.ticker}</span>
                        <div className="flex gap-1">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded border font-black uppercase ${isDarkMode ? 'text-slate-400 bg-slate-950 border-slate-800' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>{ps.country}</span>
                          <YahooIcon className="w-3 h-3 text-slate-500 group-hover:text-emerald-500" />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {ps.recommendedBy.map((rec, j) => (
                          <span key={j} className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-black uppercase tracking-tight">
                            {rec}
                          </span>
                        ))}
                      </div>
                      <p className={`text-[11px] leading-relaxed font-medium italic border-l-2 border-slate-700 pl-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>"{ps.thesisSnippet}"</p>
                    </div>
                  ))}
                  {!isRefreshing && priorityStocks.length === 0 && (
                    <p className="text-[11px] text-slate-600 text-center py-10 italic">Scanning global hubs for conviction signals...</p>
                  )}
                </div>
              </div>
            </aside>

            {/* Screener Center */}
            <section className="flex-1 flex flex-col h-full overflow-hidden">
              <div className={`px-6 py-4 flex items-center gap-8 overflow-x-auto no-scrollbar border-b ${borderClass}`}>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Node Group:</span>
                  <select className={`bg-transparent border-none text-[11px] font-bold focus:ring-0 cursor-pointer ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
                    value={filters.countryGroup} onChange={(e) => setFilters({...filters, countryGroup: e.target.value as CountryGroup})}>
                    <option value={CountryGroup.ALL} className={isDarkMode ? 'bg-slate-950' : 'bg-white'}>All Global Leaders (100+)</option>
                    <option value={CountryGroup.G7} className={isDarkMode ? 'bg-slate-950' : 'bg-white'}>G7 Nations Only</option>
                    <option value={CountryGroup.EMERGING} className={isDarkMode ? 'bg-slate-950' : 'bg-white'}>EM (IN, BR, MX, PE, CL)</option>
                    <option value={CountryGroup.OECD} className={isDarkMode ? 'bg-slate-950' : 'bg-white'}>OECD Non-EM</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Sector:</span>
                  <select className={`bg-transparent border-none text-[11px] font-bold focus:ring-0 cursor-pointer ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
                    value={filters.sector} onChange={(e) => setFilters({...filters, sector: e.target.value})}>
                    <option value="All" className={isDarkMode ? 'bg-slate-950' : 'bg-white'}>All Industries</option>
                    {SECTORS.map(s => <option key={s} value={s} className={isDarkMode ? 'bg-slate-950' : 'bg-white'}>{s}</option>)}
                  </select>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className={`text-[9px] font-bold uppercase ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Entries: {filteredStocks.length}</span>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-y-2.5">
                  <thead>
                    <tr className={`text-[10px] font-black uppercase tracking-[0.15em] ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      <th className="pb-2 pl-5 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => requestSort('ticker')}>
                        <div className="flex items-center gap-1">Ticker {getSortIcon('ticker')}</div>
                      </th>
                      <th className="pb-2 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => requestSort('name')}>
                        <div className="flex items-center gap-1">Entity {getSortIcon('name')}</div>
                      </th>
                      <th className="pb-2 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => requestSort('price')}>
                        <div className="flex items-center gap-1">Price {getSortIcon('price')}</div>
                      </th>
                      <th className="pb-2 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => requestSort('marketCap')}>
                        <div className="flex items-center gap-1">MCAP {getSortIcon('marketCap')}</div>
                      </th>
                      <th className="pb-2 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => requestSort('peRatio')}>
                        <div className="flex items-center gap-1">P/E {getSortIcon('peRatio')}</div>
                      </th>
                      <th className="pb-2 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => requestSort('roe')}>
                        <div className="flex items-center gap-1">ROE {getSortIcon('roe')}</div>
                      </th>
                      <th className="pb-2 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => requestSort('roic')}>
                        <div className="flex items-center gap-1">ROIC {getSortIcon('roic')}</div>
                      </th>
                      <th className="pb-2 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => requestSort('fcfYield')}>
                        <div className="flex items-center gap-1">FCF Yield {getSortIcon('fcfYield')}</div>
                      </th>
                      <th className="pb-2 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => requestSort('cashOnHand')}>
                        <div className="flex items-center gap-1">Cash (Bn) {getSortIcon('cashOnHand')}</div>
                      </th>
                      <th className="pb-2 pr-5 text-right cursor-pointer hover:text-emerald-500" onClick={() => requestSort('country')}>
                        <div className="flex items-center justify-end gap-1">Node {getSortIcon('country')}</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px]">
                    {filteredStocks.map((stock) => (
                      <tr key={stock.ticker} onClick={(e) => handleStockClick(stock, e)}
                        className={`group cursor-pointer transition-all border rounded-xl relative ${tableRowClass} ${isDarkMode ? (selectedStock?.ticker === stock.ticker ? 'ring-1 ring-emerald-500 border-emerald-500' : 'border-slate-800') : (selectedStock?.ticker === stock.ticker ? 'ring-1 ring-emerald-500 border-emerald-500' : 'border-slate-200')}`}>
                        <td className="py-3.5 pl-5 rounded-l-xl">
                          <div className="flex items-center gap-2">
                             <button onClick={(e) => openYahoo(stock.ticker, e)} className="p-1 hover:bg-emerald-500/20 rounded-md transition-colors">
                                <YahooIcon className="w-3 h-3 text-slate-500 group-hover:text-emerald-500" />
                             </button>
                             <span className={`font-black mono uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{stock.ticker}</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div className="flex flex-col">
                            <span className={`font-bold line-clamp-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{stock.name}</span>
                            <span className="text-[9px] text-slate-500 uppercase font-black">{stock.sector}</span>
                          </div>
                        </td>
                        <td className={`py-3.5 font-mono font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 font-mono text-slate-500">${stock.marketCap}B</td>
                        <td className={`py-3.5 font-mono ${stock.peRatio < 15 && stock.peRatio > 0 ? 'text-emerald-400 font-bold' : (isDarkMode ? 'text-slate-300' : 'text-slate-700')}`}>{stock.peRatio.toFixed(1)}x</td>
                        <td className={`py-3.5 font-mono ${stock.roe > 25 ? 'text-cyan-400 font-bold' : (isDarkMode ? 'text-slate-300' : 'text-slate-700')}`}>{stock.roe.toFixed(1)}%</td>
                        <td className="py-3.5 font-mono font-black text-emerald-500">{stock.roic.toFixed(1)}%</td>
                        <td className="py-3.5 font-mono text-slate-400">{stock.fcfYield.toFixed(1)}%</td>
                        <td className="py-3.5 font-mono font-black text-amber-500">${stock.cashOnHand}B</td>
                        <td className="py-3.5 pr-5 text-right rounded-r-xl">
                          <span className={`text-[9px] border px-2 py-1 rounded font-black uppercase tracking-tighter ${isDarkMode ? 'text-slate-400 border-slate-800 bg-slate-950' : 'text-slate-500 border-slate-200 bg-slate-50'}`}>
                            {stock.country}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Right Side - Detailed Analytics */}
            {selectedStock && (
              <aside className={`w-[480px] border-l ${borderClass} p-7 overflow-y-auto hidden xl:block animate-in slide-in-from-right duration-500 shadow-2xl z-10 ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}>
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className={`text-2xl font-black tracking-tighter uppercase leading-tight italic ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{selectedStock.name}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{selectedStock.sector}</span>
                      <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                      <button onClick={(e) => openYahoo(selectedStock.ticker, e)} className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 underline underline-offset-4 flex items-center gap-1">
                         Yahoo Finance <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                  <button onClick={() => setSelectedStock(null)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-900 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className={`h-64 mb-8 p-5 rounded-2xl border shadow-inner group ${isDarkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <Activity className="w-3.5 h-3.5 text-emerald-500" /> 30-Year Quant History
                     </div>
                   </h3>
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={generateHistoricalData(selectedStock.price, 30)}>
                        <defs>
                          <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.25}/>
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#1e293b" : "#e2e8f0"} opacity={0.3} />
                        <XAxis dataKey="year" hide />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDarkMode ? '#020617' : '#ffffff', 
                            border: `1px solid ${isDarkMode ? '#1e293b' : '#e2e8f0'}`, 
                            borderRadius: '12px', 
                            fontSize: '10px' 
                          }}
                        />
                        <Area type="monotone" dataKey="price" stroke="#10b981" fill="url(#pGrad)" strokeWidth={3} dot={false} />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>

                <div className="space-y-8 pb-10">
                   <div className="flex items-center justify-between">
                     <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                       <Briefcase className="w-3.5 h-3.5" /> High-Conviction Report
                     </h3>
                     {loadingAnalysis && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />}
                   </div>

                   {loadingAnalysis ? (
                     <div className="space-y-6">
                       <div className={`h-16 rounded-xl w-full animate-pulse ${isDarkMode ? 'bg-slate-900' : 'bg-slate-200'}`}></div>
                       <div className={`h-32 rounded-xl w-full animate-pulse ${isDarkMode ? 'bg-slate-900' : 'bg-slate-200'}`}></div>
                     </div>
                   ) : analysis && (
                     <div className="space-y-7 animate-in fade-in duration-700">
                        <div className="flex gap-4">
                          <div className={`flex-1 p-4 rounded-xl border shadow-sm text-center ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-2">Quant Valuation</span>
                            <span className={`text-sm font-black uppercase ${analysis.valuation === 'Under' ? 'text-emerald-500' : analysis.valuation === 'Over' ? 'text-rose-500' : 'text-amber-500'}`}>{analysis.valuation}valued</span>
                          </div>
                          <div className={`flex-1 p-4 rounded-xl border shadow-sm text-center ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-2">Risk Score</span>
                            <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{analysis.riskScore}/10</span>
                          </div>
                        </div>
                        <div className={`p-5 rounded-2xl border-l-4 ${isDarkMode ? 'bg-emerald-500/5 border-emerald-500/40 text-slate-300' : 'bg-emerald-50/50 border-emerald-500/50 text-slate-700'}`}>
                          <p className="text-[12px] leading-relaxed font-medium italic opacity-90">"{analysis.summary}"</p>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-emerald-500 uppercase mb-4 tracking-widest flex items-center gap-2"><ArrowUpRight className="w-3 h-3" /> Alpha Thesis</h4>
                          <div className="space-y-3">
                            {analysis.investmentThesis.map((t, i) => (
                              <div key={i} className={`text-[11px] flex items-start gap-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30 mt-1"></div>{t}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-rose-500 uppercase mb-4 tracking-widest flex items-center gap-2"><ArrowDownRight className="w-3 h-3" /> Potential Risks</h4>
                          <div className="space-y-3">
                            {analysis.risks.map((r, i) => (
                              <div key={i} className={`text-[11px] flex items-start gap-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500/30 mt-1"></div>{r}
                              </div>
                            ))}
                          </div>
                        </div>
                     </div>
                   )}
                </div>
              </aside>
            )}
          </>
        ) : (
          /* News Tab - Refined AI Feed */
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-12 pb-20">
              <div className={`p-8 rounded-3xl border-l-8 border-emerald-500 shadow-xl ${isDarkMode ? 'bg-slate-900/30 border-slate-800 shadow-emerald-950/20' : 'bg-white border-slate-100 shadow-emerald-500/5'}`}>
                <h2 className="text-3xl font-black tracking-tighter uppercase mb-4 flex items-center gap-4 italic">
                  <Globe className="w-10 h-10 text-emerald-500" /> Global Macro Sweep
                </h2>
                <p className={`text-lg leading-relaxed font-medium italic ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {marketSummary || "Synchronizing cross-border feeds from Bloomberg, Reuters, FT and Biztoc. Correlating Polymarket predictions with structural macro shifts..."}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {newsFeed.length > 0 ? newsFeed.map((news, i) => (
                  <div key={i} className={`group p-8 rounded-3xl border transition-all hover:shadow-2xl ${isDarkMode ? 'bg-slate-900/20 border-slate-800 hover:bg-slate-900/40' : 'bg-white border-slate-100 hover:shadow-emerald-500/10'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full">{news.source}</span>
                        <span className={`text-[10px] font-mono font-bold uppercase ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{news.time}</span>
                      </div>
                      <a href={news.url} target="_blank" className="text-slate-500 hover:text-emerald-500 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <h3 className={`text-xl font-black mb-4 leading-tight group-hover:text-emerald-500 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                      {news.headline}
                    </h3>
                    <div className={`text-sm leading-relaxed p-4 rounded-xl border italic ${isDarkMode ? 'bg-slate-950/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                      {news.summary}
                    </div>
                  </div>
                )) : (
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className={`h-48 rounded-3xl animate-pulse ${isDarkMode ? 'bg-slate-900/20' : 'bg-slate-100'}`} />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Status Bar */}
      <footer className={`border-t ${borderClass} px-6 py-2.5 flex items-center justify-between text-[9px] font-mono uppercase tracking-widest z-20 ${isDarkMode ? 'bg-slate-950 text-slate-600' : 'bg-white text-slate-400'}`}>
        <div className="flex gap-10">
          <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> 
            QUANT_CORE_SECURE
          </span>
          <span className="hidden md:inline">G7_CLUSTER: ACTIVE</span>
          <span className="hidden md:inline">OECD_CLUSTER: ACTIVE</span>
          <span className="hidden md:inline">EM_CLUSTER: ACTIVE (IN, BR, MX, PE, CL)</span>
        </div>
        <div className="flex gap-6">
          <span className="hidden sm:inline italic">EOD Accuracy: Synchronized via Institutional Hub</span>
          <span>&copy; 2025 QUANTEDGE_INTEL</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
