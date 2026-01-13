
import React, { useState } from 'react';
import { X, Search, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { fetchStockData } from '../services/geminiService.ts';
import { StockHolding, Language } from '../types.ts';
import { TRANSLATIONS } from '../constants.ts';

interface AddStockModalProps {
  onClose: () => void;
  onAdd: (stock: StockHolding, currentRate: number) => void;
  lang: Language;
}

export const AddStockModal: React.FC<AddStockModalProps> = ({ onClose, onAdd, lang }) => {
  const t = TRANSLATIONS[lang];
  const [ticker, setTicker] = useState('');
  const [shares, setShares] = useState<number>(0);
  const [avgPrice, setAvgPrice] = useState<number>(0);
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !purchaseDate) return;
    
    setLoading(true);
    setError('');
    
    const data = await fetchStockData(ticker.toUpperCase(), purchaseDate, lang);
    
    if (data) {
      const newStock: StockHolding = {
        id: Math.random().toString(36).substr(2, 9),
        ticker: ticker.toUpperCase(),
        name: data.name || ticker.toUpperCase(),
        shares,
        avgPrice,
        currentPrice: data.currentPrice || 0,
        dividendPerShare: data.dividendPerShare || 0,
        dividendYield: data.dividendYield || 0,
        frequency: (data.frequency as any) || 'Quarterly',
        purchaseDate: purchaseDate,
        exchangeRateAtPurchase: data.exchangeRateAtPurchase || 1350,
        lastUpdated: new Date().toISOString(),
      };
      onAdd(newStock, data.currentExchangeRate);
      onClose();
    } else {
      setError(lang === 'ko' ? '종목 정보를 찾을 수 없습니다. 티커를 확인해주세요.' : 'Could not find stock info. Please check the ticker.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative miniature-in">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X size={20} className="text-slate-400" />
        </button>

        <h2 className="text-2xl font-bold text-slate-800 mb-6">{t.modalTitle}</h2>
        
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">{t.tickerLabel}</label>
            <div className="relative">
              <input 
                type="text"
                placeholder="e.g. MSFT"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-400 focus:outline-none transition-all uppercase"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                required
              />
              <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">{t.sharesLabel}</label>
              <input 
                type="number"
                step="0.01"
                placeholder="0"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-400 focus:outline-none transition-all"
                value={shares || ''}
                onChange={(e) => setShares(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">{t.avgPriceLabel}</label>
              <input 
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-400 focus:outline-none transition-all"
                value={avgPrice || ''}
                onChange={(e) => setAvgPrice(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">{t.purchaseDateLabel}</label>
            <div className="relative">
              <input 
                type="date"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-400 focus:outline-none transition-all"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
              <CalendarIcon className="absolute left-3 top-3.5 text-slate-400" size={18} />
            </div>
          </div>

          {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : t.discoverButton}
          </button>
        </form>
      </div>
    </div>
  );
};
