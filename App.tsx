
import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  Plus, 
  PieChart as PieChartIcon, 
  Calendar, 
  DollarSign, 
  Trash2, 
  Sparkles,
  RefreshCw,
  Languages,
  Wallet
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { StockHolding, DividendInsight, Language, Currency } from './types';
import { INITIAL_HOLDINGS, MONTHS, TRANSLATIONS } from './constants';
import { MiniatureCard } from './components/MiniatureCard';
import { AddStockModal } from './components/AddStockModal';
import { getPortfolioInsights, getCurrentExchangeRate } from './services/geminiService';

const COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#818CF8', '#A78BFA'];

export default function App() {
  const [lang, setLang] = useState<Language>('ko');
  const [currency, setCurrency] = useState<Currency>('KRW');
  const [holdings, setHoldings] = useState<StockHolding[]>(INITIAL_HOLDINGS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [insights, setInsights] = useState<DividendInsight | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [currentExchangeRate, setCurrentExchangeRate] = useState(1350);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const fetchRate = async () => {
      const rate = await getCurrentExchangeRate();
      setCurrentExchangeRate(rate);
    };
    fetchRate();
  }, []);

  const formatValue = (val: number, isCurrency = true) => {
    if (!isCurrency) return val.toLocaleString();
    if (currency === 'USD') {
      return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `₩${Math.round(val).toLocaleString()}`;
    }
  };

  // Convert USD to display value based on currency setting
  const toDisplay = (usdVal: number, type: 'current' | 'cost' | 'income' = 'current', historicalRate?: number) => {
    if (currency === 'USD') return usdVal;
    const rate = (type === 'cost' && historicalRate) ? historicalRate : currentExchangeRate;
    return usdVal * rate;
  };

  // Stats Calculations
  const totalInvested = useMemo(() => 
    holdings.reduce((sum, h) => sum + toDisplay(h.shares * h.avgPrice, 'cost', h.exchangeRateAtPurchase), 0), 
  [holdings, currency, currentExchangeRate]);

  const totalValue = useMemo(() => 
    holdings.reduce((sum, h) => sum + toDisplay(h.shares * h.currentPrice, 'current'), 0), 
  [holdings, currency, currentExchangeRate]);

  const annualDividend = useMemo(() => 
    holdings.reduce((sum, h) => sum + toDisplay(h.shares * h.dividendPerShare, 'income'), 0), 
  [holdings, currency, currentExchangeRate]);

  const monthlyDividendData = useMemo(() => {
    const months = MONTHS[lang];
    const enMonths = MONTHS['en'];
    return months.map((month, idx) => {
      const enMonth = enMonths[idx];
      let totalUsd = 0;
      holdings.forEach(h => {
        const annualUsd = h.dividendPerShare * h.shares;
        if (h.frequency === 'Monthly') {
          totalUsd += annualUsd / 12;
        } else if (h.frequency === 'Quarterly') {
          if (['Mar', 'Jun', 'Sep', 'Dec'].includes(enMonth)) {
            totalUsd += annualUsd / 4;
          }
        } else if (h.frequency === 'Semi-Annual') {
            if (['Jun', 'Dec'].includes(enMonth)) {
                totalUsd += annualUsd / 2;
            }
        } else if (enMonth === 'Jun') {
          totalUsd += annualUsd;
        }
      });
      return { month, amount: toDisplay(totalUsd, 'income') };
    });
  }, [holdings, lang, currency, currentExchangeRate]);

  const pieData = useMemo(() => 
    holdings.map(h => ({ 
      name: h.ticker, 
      value: toDisplay(h.shares * h.currentPrice, 'current'),
      shares: h.shares
    })), 
  [holdings, currency, currentExchangeRate]);

  const handleAddStock = (stock: StockHolding, latestRate: number) => {
    setHoldings([...holdings, stock]);
    if (latestRate) setCurrentExchangeRate(latestRate);
  };

  const removeStock = (id: string) => {
    setHoldings(holdings.filter(h => h.id !== id));
  };

  const fetchInsights = async () => {
    setLoadingInsights(true);
    const data = await getPortfolioInsights(holdings, lang);
    setInsights(data);
    setLoadingInsights(false);
  };

  useEffect(() => {
    if (holdings.length > 0) {
      fetchInsights();
    }
  }, [holdings.length, lang]);

  const profitValue = totalValue - totalInvested;

  return (
    <div className="min-h-screen pb-20">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50 -z-10"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-green-50 rounded-full blur-[120px] opacity-40 -z-10"></div>

      <header className="px-6 py-8 md:px-12 md:py-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <TrendingUp size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">TinyDividend</h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">{t.appSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setCurrency(prev => prev === 'USD' ? 'KRW' : 'USD')}
            className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all font-bold text-slate-600 active:scale-95"
          >
            <Wallet size={18} className="text-emerald-500" />
            <span className="text-sm">{currency}</span>
          </button>

          <button 
            onClick={() => setLang(prev => prev === 'en' ? 'ko' : 'en')}
            className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all font-bold text-slate-600 active:scale-95"
          >
            <Languages size={18} className="text-blue-500" />
            <span className="uppercase text-sm">{lang}</span>
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-500 px-6 py-3 rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-600 transition-all font-bold text-white active:scale-95"
          >
            <Plus size={20} />
            {t.addAsset}
          </button>
        </div>
      </header>

      <main className="px-6 md:px-12 space-y-8 max-w-7xl mx-auto">
        
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MiniatureCard 
            title={t.totalMarketValue} 
            value={formatValue(totalValue)}
            subtitle={
              <span>
                {t.profit}: <span className={profitValue >= 0 ? 'text-red-500 font-bold' : 'text-blue-500 font-bold'}>
                  {formatValue(profitValue)}
                </span>
              </span>
            }
            icon={<TrendingUp className="text-emerald-500" />}
          />
          <MiniatureCard 
            title={t.annualPassiveIncome} 
            value={formatValue(annualDividend)}
            subtitle={`${t.avgMonthly}: ${formatValue(annualDividend / 12)}`}
            icon={<DollarSign className="text-blue-500" />}
          />
          <MiniatureCard 
            title={t.yieldOnCost} 
            value={`${totalInvested > 0 ? ((annualDividend / totalInvested) * 100).toFixed(2) : 0}%`}
            subtitle={t.efficiencyMsg}
            icon={<RefreshCw className="text-amber-500" />}
          />
          <MiniatureCard 
            title={t.activeTickers} 
            value={holdings.length}
            subtitle={t.diversifiedMsg}
            icon={<PieChartIcon className="text-purple-500" />}
          />
        </section>

        <section className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles size={24} className="text-yellow-300" />
              <h2 className="text-xl font-bold">{t.aiInsights}</h2>
            </div>
            
            {loadingInsights ? (
              <div className="space-y-3">
                <div className="h-4 w-full bg-white/20 animate-pulse rounded"></div>
                <div className="h-4 w-2/3 bg-white/20 animate-pulse rounded"></div>
              </div>
            ) : insights ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="col-span-2">
                  <p className="text-indigo-50 leading-relaxed mb-4">{insights.summary}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">{t.growthOutlook}</p>
                  <p className="text-sm">{insights.growthPotential}</p>
                </div>
                <div className="flex flex-col items-center justify-center bg-white/10 rounded-3xl p-6 border border-white/10 backdrop-blur-md">
                  <span className="text-xs uppercase font-bold text-indigo-200 mb-1">{t.safetyScore}</span>
                  <span className="text-5xl font-black">{insights.safetyScore}<span className="text-xl opacity-60">/10</span></span>
                </div>
              </div>
            ) : (
              <p className="text-indigo-100">{t.aiDescription}</p>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
                  <Calendar size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">{t.monthlyPayouts}</h2>
              </div>
              <p className="text-slate-400 text-sm font-medium">{t.estimatedProjections}</p>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyDividendData} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    width={currency === 'KRW' ? 65 : 45}
                    tickFormatter={(value) => {
                      if (currency === 'USD') return value;
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                      return value;
                    }}
                    tick={{ fill: '#94a3b8', fontSize: 11 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(value: number) => [formatValue(value), lang === 'ko' ? '금액' : 'Amount']}
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontWeight: 600
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="#3B82F6" 
                    radius={[6, 6, 0, 0]} 
                    barSize={24} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
                <PieChartIcon size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">{t.tinyAllocation}</h2>
            </div>
            
            <div className="h-[250px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                     formatter={(value, name, entry) => {
                       if (lang === 'ko') {
                         return [`${entry.payload.shares} 주`, '보유 수량'];
                       }
                       return [value, name];
                     }}
                     contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 space-y-3">
              {holdings.slice(0, 3).map((h, i) => (
                <div key={h.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="font-semibold text-slate-600">{h.ticker}</span>
                  </div>
                  <span className="text-slate-400 font-medium">{totalValue > 0 ? ((toDisplay(h.shares * h.currentPrice, 'current') / totalValue) * 100).toFixed(1) : 0}%</span>
                </div>
              ))}
              {holdings.length > 3 && (
                <p className="text-center text-xs text-slate-400 font-medium mt-2">+{holdings.length - 3} more assets</p>
              )}
            </div>
          </div>
        </div>

        <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl font-bold text-slate-800">{t.portfolioTitle}</h2>
            <div className="flex items-center gap-4">
              <div className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                {holdings.length}{lang === 'ko' ? t.assetsTracked : ` ${t.assetsTracked}`}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-50">
                  <th className="pb-4 pl-2">{t.assetHeader}</th>
                  <th className="pb-4">{t.holdingsHeader}</th>
                  <th className="pb-4">{t.marketPriceHeader}</th>
                  <th className="pb-4">{t.divYieldHeader}</th>
                  <th className="pb-4">{t.annualIncomeHeader}</th>
                  <th className="pb-4 text-right pr-2">{t.actionsHeader}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {holdings.map((h) => (
                  <tr key={h.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-5 pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">
                          {h.ticker[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{h.ticker}</p>
                          <p className="text-xs text-slate-400 font-medium">{h.name}</p>
                          <p className="text-[10px] text-slate-300 font-mono mt-0.5">{h.purchaseDate}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5">
                      <p className="font-bold text-slate-700">{h.shares.toFixed(2)}</p>
                      <p className="text-xs text-slate-400 font-medium">
                        {t.avgPriceLabel}: {formatValue(toDisplay(h.avgPrice, 'cost', h.exchangeRateAtPurchase))}
                      </p>
                    </td>
                    <td className="py-5">
                      <p className="font-bold text-slate-700">{formatValue(toDisplay(h.currentPrice, 'current'))}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${h.currentPrice >= h.avgPrice ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {h.currentPrice >= h.avgPrice ? '+' : ''}{h.avgPrice > 0 ? ((h.currentPrice - h.avgPrice) / h.avgPrice * 100).toFixed(1) : 0}%
                      </span>
                    </td>
                    <td className="py-5">
                      <p className="font-bold text-slate-700">{h.dividendYield.toFixed(2)}%</p>
                      <p className="text-xs text-slate-400 font-medium">{h.frequency}</p>
                    </td>
                    <td className="py-5">
                      <p className="font-bold text-blue-600">{formatValue(toDisplay(h.dividendPerShare * h.shares, 'income'))}</p>
                      <p className="text-xs text-slate-400 font-medium">{lang === 'ko' ? '주당:' : 'Per share:'} {formatValue(toDisplay(h.dividendPerShare, 'income'))}</p>
                    </td>
                    <td className="py-5 text-right pr-2">
                      <button 
                        onClick={() => removeStock(h.id)}
                        className="p-2 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {holdings.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-400 font-medium">{t.emptyState}</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="mt-4 text-blue-500 font-bold hover:underline"
              >
                {t.startBuilding}
              </button>
            </div>
          )}
        </section>
      </main>

      <button 
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-xl shadow-blue-300 flex items-center justify-center active:scale-90 transition-transform z-40"
      >
        <Plus size={24} />
      </button>

      {isModalOpen && (
        <AddStockModal 
          lang={lang}
          onClose={() => setIsModalOpen(false)} 
          onAdd={handleAddStock}
        />
      )}
    </div>
  );
}
