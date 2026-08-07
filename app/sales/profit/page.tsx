"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  FileText, 
  Loader2, 
  Sparkles, 
  DollarSign, 
  ArrowUpRight,
  Search,
  Calendar,
  Filter
} from "lucide-react";

interface SaleOrder {
  id: string;
  invoiceNo: string;
  grandTotal: number;
  profitAmount: number;
  createdAt: string;
  customer?: { name: string; phone: string };
}

export default function SalesProfitPage() {
  const [sales, setSales] = useState<SaleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Helper Function for DD/MM/YYYY Date Formatting
  const formatDateDMY = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const fetchSalesProfit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sales");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSales(data.data);
      }
    } catch (err) {
      console.error("Failed to load profit report", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesProfit();
  }, []);

  // Filter Sales
  const filteredSales = sales.filter(
    (s) =>
      s.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.customer?.name && s.customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 🎯 নিখুঁত সামারি হিসাব
  const totalRevenue = filteredSales.reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0);
  const totalProfit = filteredSales.reduce((sum, s) => sum + (Number(s.profitAmount) || 0), 0);
  const profitMarginPercentage = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 px-4 sm:px-6 my-6 text-xs">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-800/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px] uppercase tracking-wider mb-1.5">
            <Sparkles className="w-4 h-4" /> Confidential Owner Analytics
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Product Sales Profit Report</h1>
          <p className="text-emerald-200/70 text-xs mt-1">Detailed cost vs selling profit margins on product sales.</p>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 block">Overall Margin</span>
            <span className="text-xl font-black text-emerald-400">{profitMarginPercentage}% Avg Margin</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-600 text-white p-5 rounded-2xl shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 block">Total Net Product Profit</span>
          <p className="text-2xl font-black text-white">৳ {totalProfit.toLocaleString()} BDT</p>
          <span className="text-[10px] text-emerald-100/80">Net Margin Earned</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Sales Turnover</span>
          <p className="text-2xl font-black text-slate-900">৳ {totalRevenue.toLocaleString()} BDT</p>
          <span className="text-[10px] text-slate-400">{filteredSales.length} Total Orders</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Average Profit Per Sale</span>
          <p className="text-2xl font-black text-blue-600">
            ৳ {filteredSales.length > 0 ? (totalProfit / filteredSales.length).toFixed(2) : "0.00"} BDT
          </p>
          <span className="text-[10px] text-slate-400">Per Order Avg</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by invoice number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          onClick={fetchSalesProfit}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-bold"
        >
          <Loader2 className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          <span className="hidden sm:inline">Refresh Data</span>
        </button>
      </div>

      {/* Invoice Profit Margin Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b font-bold text-slate-800 text-xs flex justify-between items-center">
          <span>Invoice Profit Margin Breakdown</span>
          <span className="text-slate-400 font-normal">Showing {filteredSales.length} Transactions</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-bold flex justify-center items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> Loading Profit History...
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            No sales orders match your search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-4 pl-6">Invoice / Date</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Total Sale</th>
                  <th className="p-4 text-right pr-6">Net Profit Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSales.map((s) => {
                  const profit = Number(s.profitAmount) || 0;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 pl-6 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          {s.invoiceNo}
                        </div>
                        <span className="text-slate-400 font-normal block text-[10px] mt-0.5">
                          {formatDateDMY(s.createdAt)}
                        </span>
                      </td>

                      <td className="p-4 font-semibold text-slate-700">
                        {s.customer?.name || <span className="text-slate-400 italic">Walk-in Customer</span>}
                      </td>

                      <td className="p-4 font-bold text-slate-900">
                        ৳ {(Number(s.grandTotal) || 0).toLocaleString()}
                      </td>

                      <td className="p-4 pr-6 font-black text-right">
                        <span className={`px-2.5 py-1 rounded-lg ${
                          profit > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          +৳ {profit.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}