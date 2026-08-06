"use client";

import { useEffect, useState } from "react";
import { TrendingUp, FileText, Loader2, Sparkles, DollarSign, ArrowUpRight } from "lucide-react";

interface SaleOrder {
  id: string;
  invoiceNo: string;
  grandTotal: number;
  profitAmount: number;
  createdAt: string;
  customer?: { name: string };
}

export default function SalesProfitPage() {
  const [sales, setSales] = useState<SaleOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sales")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSales(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalProfit = sales.reduce((sum, s) => sum + (s.profitAmount || 0), 0);
  const totalRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 px-4 sm:px-6 my-6">
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-8 rounded-3xl shadow-xl border border-emerald-800/50">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" /> Confidential Owner Analytics
        </div>
        <h1 className="text-3xl font-black text-white">Product Sales Profit Report</h1>
        <p className="text-emerald-200/70 text-xs mt-1">Detailed cost vs selling profit margins on product sales.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-md space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Total Net Product Profit</span>
          <p className="text-3xl font-black">৳ {totalProfit.toLocaleString()} BDT</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales Turnover</span>
          <p className="text-3xl font-black text-slate-900">৳ {totalRevenue.toLocaleString()} BDT</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b font-bold text-slate-800 text-xs">Invoice Profit Margin History</div>
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs font-bold">Loading profit report...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase">
                  <th className="p-4">Invoice / Date</th>
                  <th className="p-4">Total Sale</th>
                  <th className="p-4 text-right">Profit Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">{s.invoiceNo} <span className="text-slate-400 font-normal block text-[10px]">{new Date(s.createdAt).toLocaleDateString()}</span></td>
                    <td className="p-4 font-bold text-slate-700">৳ {s.grandTotal.toLocaleString()}</td>
                    <td className="p-4 font-black text-emerald-600 text-right">+৳ {(s.profitAmount || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}