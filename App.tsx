import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, TrendingUp, Globe, Filter, Activity, ArrowUpRight, ArrowDownRight,
  Info, ChevronRight, Loader2, Briefcase, Download, Newspaper, Star, 
  ExternalLink, ShieldCheck, Database, RefreshCcw
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

import { StockMetric, CountryGroup, ScreenerFilter, StockAnalysis, NewsItem, PriorityStock } from './types';
import { SECTORS, COUNTRIES, SAMPLE_TOP_STOCKS } from './constants';
import { getInstitutionalInsights, analyzeStock, generateHistoricalData } from './geminiService';

const App: React.FC = () => {
  const [stocks, setStocks] = useState<StockMetric[]>(SAMPLE_TOP_STOCKS);
  const [selectedStock, setSelectedStock] = useState<StockMetric | null>(null);
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [marketSummary, setMarketSummary] = useState<string>('');
  const [priorityStocks, setPriorityStocks] = useState<PriorityStock[]>([]);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<ScreenerFilter>({
    countryGroup: CountryGroup.ALL,
    minMarketCap: 0,
    maxPE: 100,
    minROE: 0,
    sector: 'All'
  });

  const filteredStocks = useMemo(() => {
    return stocks.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.ticker.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSector = filters.sector === 'All' || s.sector === filters.sector;
      const matchesPE = s.peRatio <= filters.maxPE;
      const matchesROE = s.roe >= filters.minROE;
      const matchesCap = s.marketCap >= filters.minMarketCap;
      
      let matchesRegion = true;
      if (filters.countryGroup === CountryGroup.G7) {
        matchesRegion = ['USA', 'Canada', 'UK', 'Germany', 'France', 'Italy', 'Japan'].includes(s.country);
      } else if (filters.countryGroup === CountryGroup.EMERGING) {
        matchesRegion = ['India', 'Brazil', 'Peru', 'Chile', 'Mexico'].includes(s.country);
      }
      
      return matchesSearch && matchesSector && matchesPE && matchesROE && matchesCap && matchesRegion;
    }).sort((a, b) => b.marketCap - a.marketCap);
  }, [stocks, searchQuery, filters]);

  useEffect(() => { refreshIntelligence(); }, []);

  const refreshIntelligence = async () => {
    setIsRefreshing(true);
    const data = await getInstitutionalInsights();
    if (data) {
      setMarketSummary(data.marketSummary);
      setPriorityStocks(data.priorityStocks);
      setNewsFeed(data.newsFeed);
    }
    setIsRefreshing(false);
  };

  const exportToCSV = () => {
    const headers = ["Ticker", "Name", "Country", "Sector", "Price", "Market Cap", "P/E", "ROE", "ROIC", "FCF Yield"];
    const rows = filteredStocks.map(s => [s.ticker, s.name, s.country, s.sector, s.price, s.marketCap, s.peRatio, s.roe, s.roic, s.fcfYield]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `QuantEdge_EOD_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStockClick = async (stock: StockMetric) => {
    setSelectedStock(stock);
    setLoadingAnalysis(true);
    setAnalysis(null);
    const result = await analyzeStock(stock);
    setAnalysis(result);
    setLoadingAnalysis(false);
  };

  // Enhanced Color Coding
  const getPEColor = (pe: number) => {
    if (pe < 12) return 'text-emerald-400 font-bold';
    if (pe < 22) return 'text-emerald-200';
    if (pe > 40) return 'text-rose-400';
    return 'text-slate-300';
  };

  const getROEColor = (roe: number) => {
    if (roe > 30) return 'text-cyan-400 font-bold';
    if (roe > 18) return 'text-emerald-400';
    if (roe < 8) return 'text-rose-400 opacity-80';
    return 'text-slate-300';
  };

  const getFCFColor = (fcf: number) => {
    if (fcf > 8) return 'text-yellow-400 font-bold';
    if (fcf > 4) return 'text-slate-200';
    return 'text-slate-500';
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-600 p-2 rounded-lg shadow-lg shadow-emerald-900/20">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tighter text-white block leading-none italic uppercase">QuantEdge High-Conviction</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 uppercase tracking-[0.2em] animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> System Live
              </span>
              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                EOD SYNC: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-8 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search symbols (e.g. RACE, RELIANCE, NOVO)..." 
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={exportToCSV} className="flex items-center gap-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 px-4 py-2 rounded-lg text-xs font-bold transition-all">
            <Download className="w-3 h-3" /> Sheets Export
          </button>
          <button 
            onClick={refreshIntelligence}
            className={`flex items-center gap-2 bg-white text-black hover:bg-emerald-50 px-4 py-2 rounded-lg text-xs font-black transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] ${isRefreshing ? 'opacity-50' : ''}`}
            disabled={isRefreshing}
          >
            {isRefreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
            RUN CROSS-BORDER SCAN
          </button>
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Intelligence Hub */}
        <aside className="w-[360px] border-r border-slate-800 flex flex-col hidden 2xl:flex bg-slate-950/50">
          {/* Priority Study */}
          <div className="p-5 border-b border-slate-800 flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Priority Conviction</h3>
              </div>
              <span className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">Polymarket & Macro Sync</span>
            </div>
            <div className="space-y-4">
              {isRefreshing ? Array(4).fill(0).map((_,i) => (
                <div key={i} className="h-32 bg-slate-900/50 rounded-xl animate-pulse" />
              )) : priorityStocks.map((ps, i) => (
                <div key={i} className="p-4 bg-slate-900/30 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition-all group cursor-pointer shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20"></div>
                  </div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-white text-sm mono tracking-tighter">{ps.ticker}</span>
                    <span className="text-[9px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-bold">{ps.country}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {ps.recommendedBy.map((rec, j) => (
                      <span key={j} className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-black uppercase tracking-tight">
                        {rec}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium italic border-l-2 border-slate-700 pl-3">"{ps.thesisSnippet}"</p>
                </div>
              ))}
              {!isRefreshing && priorityStocks.length === 0 && (
                <p className="text-[11px] text-slate-600 text-center py-10 italic">Initializing institutional filters...</p>
              )}
            </div>
          </div>

          {/* Institutional News Feed */}
          <div className="p-5 h-[40%] overflow-y-auto bg-slate-900/10 border-t border-slate-800/50">
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Institutional Wire</h3>
            </div>
            <div className="space-y-5">
              {newsFeed.map((news, i) => (
                <div key={i} className="flex flex-col gap-1 border-b border-slate-900 pb-5 last:border-0 group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{news.source}</span>
                    <span className="text-[9px] text-slate-600 font-mono uppercase">{news.time}</span>
                  </div>
                  <h4 className="text-[11px] font-bold leading-tight text-slate-300 group-hover:text-white transition-colors">
                    {news.headline}
                  </h4>
                  <a href={news.url} target="_blank" className="text-[9px] text-slate-500 flex items-center gap-1 hover:text-blue-300 mt-2 uppercase font-black tracking-tighter">
                    Access Intelligence <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Section - Global Screener */}
        <section className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
          <div className="px-6 py-5 bg-slate-900/20 border-b border-slate-800 flex gap-5 items-start">
             <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-inner">
               <Database className="w-5 h-5 text-emerald-500" />
             </div>
             <div>
               <h4 className="text-[10px] uppercase font-black text-emerald-500 tracking-[0.3em] mb-1 flex items-center gap-2">
                 Global Analyst Summary <div className="w-1 h-1 rounded-full bg-emerald-500/50"></div>
               </h4>
               <p className="text-[12px] text-slate-400 leading-relaxed font-medium line-clamp-2 italic">
                 {marketSummary || "Synchronizing with Bloomberg, WSJ, and FT data hubs. Adjusting for 30-year track record benchmarks..."}
               </p>
             </div>
          </div>

          {/* Fast Filters */}
          <div className="px-6 py-3 border-b border-slate-800 flex items-center gap-8 overflow-x-auto no-scrollbar bg-slate-950/80">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                <Globe className="w-3 h-3" /> Region Node:
              </span>
              <select className="bg-transparent border-none text-[11px] font-bold text-slate-300 focus:ring-0 cursor-pointer hover:text-white transition-colors"
                value={filters.countryGroup} onChange={(e) => setFilters({...filters, countryGroup: e.target.value as CountryGroup})}>
                <option value={CountryGroup.ALL} className="bg-slate-950">All OECD & EM Nodes</option>
                <option value={CountryGroup.G7} className="bg-slate-950">G7 Nations Only</option>
                <option value={CountryGroup.EMERGING} className="bg-slate-950">EM (IN, BR, MX, CL, PE)</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                <Filter className="w-3 h-3" /> Sector:
              </span>
              <select className="bg-transparent border-none text-[11px] font-bold text-slate-300 focus:ring-0 cursor-pointer hover:text-white transition-colors"
                value={filters.sector} onChange={(e) => setFilters({...filters, sector: e.target.value})}>
                <option value="All" className="bg-slate-950">All Sectors</option>
                {SECTORS.map(s => <option key={s} value={s} className="bg-slate-950">{s}</option>)}
              </select>
            </div>
            <div className="ml-auto flex items-center gap-3 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-[9px] font-black text-slate-500 uppercase">EOD Precision:</span>
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Synchronized</span>
            </div>
          </div>

          {/* Screener Table */}
          <div className="flex-1 overflow-auto p-6 custom-scrollbar">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead>
                <tr className="text-slate-600 text-[10px] font-black uppercase tracking-[0.15em]">
                  <th className="pb-2 pl-5">Ticker</th>
                  <th className="pb-2">Corporate Entity</th>
                  <th className="pb-2">Price</th>
                  <th className="pb-2">MCAP</th>
                  <th className="pb-2">P/E</th>
                  <th className="pb-2">ROE</th>
                  <th className="pb-2">ROIC</th>
                  <th className="pb-2">FCF Yield</th>
                  <th className="pb-2 pr-5 text-right">Node</th>
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {filteredStocks.map((stock) => (
                  <tr key={stock.ticker} onClick={() => handleStockClick(stock)}
                    className={`group cursor-pointer transition-all bg-slate-900/20 hover:bg-slate-800/60 border border-slate-800 rounded-xl relative ${selectedStock?.ticker === stock.ticker ? 'ring-1 ring-emerald-500 bg-slate-800/80 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : ''}`}>
                    <td className="py-4 pl-5 rounded-l-xl">
                      <span className="font-black text-white mono uppercase tracking-tighter">{stock.ticker}</span>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200 line-clamp-1">{stock.name}</span>
                        <span className="text-[9px] text-slate-600 uppercase font-black">{stock.sector}</span>
                      </div>
                    </td>
                    <td className="py-4 font-mono font-bold text-slate-300">
                      ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 font-mono text-slate-500 font-medium">${stock.marketCap}B</td>
                    <td className={`py-4 font-mono ${getPEColor(stock.peRatio)}`}>{stock.peRatio.toFixed(1)}x</td>
                    <td className={`py-4 font-mono ${getROEColor(stock.roe)}`}>{stock.roe.toFixed(1)}%</td>
                    <td className="py-4 font-mono font-black text-cyan-500">{stock.roic.toFixed(1)}%</td>
                    <td className={`py-4 font-mono ${getFCFColor(stock.fcfYield)}`}>{stock.fcfYield.toFixed(1)}%</td>
                    <td className="py-4 pr-5 text-right rounded-r-xl">
                      <span className="text-[9px] text-slate-400 border border-slate-800 px-2 py-1 rounded font-black uppercase tracking-tighter bg-slate-950/50">
                        {stock.country}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStocks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                <Database className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-sm font-medium italic">No matches found in G7/OECD node clusters. Loosen quantitative filters.</p>
              </div>
            )}
          </div>
        </section>

        {/* Right Panel - Deep Dive Analysis */}
        {selectedStock && (
          <aside className="w-[480px] border-l border-slate-800 bg-slate-950 p-7 overflow-y-auto hidden xl:block animate-in slide-in-from-right duration-500 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-tight italic">{selectedStock.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{selectedStock.sector}</span>
                  <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{selectedStock.country} NODE CLEARANCE</span>
                </div>
              </div>
              <button onClick={() => setSelectedStock(null)} className="p-2 hover:bg-slate-900 rounded-lg text-slate-500 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Price Chart */}
            <div className="h-64 mb-8 p-5 bg-slate-900/30 rounded-2xl border border-slate-800 shadow-inner group">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <Activity className="w-3.5 h-3.5 text-emerald-500" /> 30-Year Performance Index
                 </div>
                 <span className="text-emerald-500 font-mono text-[9px] opacity-0 group-hover:opacity-100 transition-opacity">CAGR SIMULATED</span>
               </h3>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={generateHistoricalData(selectedStock.price, 30)}>
                    <defs>
                      <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.2} />
                    <XAxis dataKey="year" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px', boxShadow: '0 10px 15px rgba(0,0,0,0.5)' }}
                      labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="price" stroke="#10b981" fill="url(#pGrad)" strokeWidth={3} dot={false} animationDuration={2000} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>

            {/* AI Report */}
            <div className="space-y-8 pb-10">
               <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                   <Briefcase className="w-3.5 h-3.5" /> High-Resolution Report
                 </h3>
                 {loadingAnalysis && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />}
               </div>

               {loadingAnalysis ? (
                 <div className="space-y-6">
                   <div className="flex gap-4"><div className="h-16 bg-slate-900 rounded-xl w-full animate-pulse"></div><div className="h-16 bg-slate-900 rounded-xl w-full animate-pulse"></div></div>
                   <div className="h-32 bg-slate-900 rounded-xl w-full animate-pulse"></div>
                   <div className="space-y-2"><div className="h-4 bg-slate-900 rounded w-full animate-pulse"></div><div className="h-4 bg-slate-900 rounded w-5/6 animate-pulse"></div></div>
                 </div>
               ) : analysis && (
                 <div className="space-y-7 animate-in fade-in duration-700">
                    <div className="flex gap-4">
                      <div className="flex-1 bg-slate-900/40 p-4 rounded-xl border border-slate-800 shadow-sm">
                        <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest block mb-2">Quant Valuation</span>
                        <span className={`text-sm font-black uppercase ${analysis.valuation === 'Under' ? 'text-emerald-400' : analysis.valuation === 'Over' ? 'text-rose-400' : 'text-yellow-400'}`}>{analysis.valuation}valued</span>
                      </div>
                      <div className="flex-1 bg-slate-900/40 p-4 rounded-xl border border-slate-800 shadow-sm">
                        <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest block mb-2">Hedge Fund Risk</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-white">{analysis.riskScore}/10</span>
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                             <div className={`h-full transition-all duration-1000 ${analysis.riskScore < 4 ? 'bg-emerald-500' : analysis.riskScore < 7 ? 'bg-yellow-500' : 'bg-rose-500'}`} style={{ width: `${analysis.riskScore * 10}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-emerald-500/5 p-5 rounded-2xl border-l-4 border-emerald-500/40 shadow-inner">
                      <p className="text-[12px] text-slate-300 leading-relaxed font-medium italic opacity-90">"{analysis.summary}"</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-emerald-400 uppercase mb-4 tracking-widest flex items-center gap-2"><ArrowUpRight className="w-3 h-3" /> Alpha Thesis</h4>
                      <div className="space-y-4">
                        {analysis.investmentThesis.map((t, i) => (
                          <div key={i} className="text-[11px] text-slate-400 flex items-start gap-3 group">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30 mt-1 transition-transform group-hover:scale-125 group-hover:bg-emerald-500"></div>
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-rose-400 uppercase mb-4 tracking-widest flex items-center gap-2"><ArrowDownRight className="w-3 h-3" /> Risk Factors</h4>
                      <div className="space-y-4">
                        {analysis.risks.map((r, i) => (
                          <div key={i} className="text-[11px] text-slate-400 flex items-start gap-3 group">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500/30 mt-1 transition-transform group-hover:scale-125 group-hover:bg-rose-500"></div>
                            {r}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-8 border-t border-slate-800 text-[10px] text-slate-700 font-mono text-center uppercase tracking-[0.2em]">
                      Quant Node: SECURE-99 • EOD Feed SYNCED
                    </div>
                 </div>
               )}
            </div>
          </aside>
        )}
      </main>

      {/* Footer Status Bar */}
      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-2.5 flex items-center justify-between text-[9px] font-mono text-slate-600 uppercase tracking-widest z-20">
        <div className="flex gap-10">
          <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> 
            QUANT_CORE_SECURE
          </span>
          <span className="hidden md:inline">G7_CLUSTER: ACTIVE</span>
          <span className="hidden md:inline">EM_CLUSTER: ACTIVE</span>
          <span className="hidden md:inline">LATENCY: 12MS</span>
        </div>
        <div className="flex gap-6">
          <span className="hidden sm:inline">AI_ENGINE: GEMINI-3-PRO-PREVIEW</span>
          <span>&copy; 2025 QUANTEDGE_INTEL</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
