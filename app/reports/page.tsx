"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Receipt, 
  PieChart, 
  Calendar, 
  Loader2, 
  ArrowUpRight, 
  ArrowDownRight,
  Landmark,
  Smartphone,
  // WalletCard
} from "lucide-react";

interface ReportData {
  summary: {
    totalSales: number;
    totalSalesCount: number;
    cashCollected: number;
    totalDueGiven: number;
    grossProfit: number;
    posProfit: number;
    mfsProfit: number;
    rechargeProfit: number;
    totalExpenses: number;
    netProfitOrLoss: number;
    isProfit: boolean;
  };
  categoryExpenses: { categoryName: string; amount: number }[];
  dateRange: { start: string; end: string };
}

export default function ReportsPage() {
  const [range, setRange] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("DAILY");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?range=${range}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Error fetching reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [range]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <PieChart className="w-7 h-7 text-emerald-600" />
            Business Financial Health & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time profit & loss breakdown, expense analysis, and sales performance.
          </p>
        </div>

        {/* Time Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setRange("DAILY")}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              range === "DAILY" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setRange("WEEKLY")}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              range === "WEEKLY" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setRange("MONTHLY")}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              range === "MONTHLY" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          Analyzing financial database records...
        </div>
      ) : data ? (
        <>
          {/* Net Profit / Loss Banner (HEART OF APP) */}
          <div
            className={`p-6 rounded-2xl border shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4 ${
              data.summary.isProfit
                ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-500"
                : "bg-gradient-to-r from-rose-600 to-red-700 text-white border-rose-500"
            }`}
          >
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-1 justify-center sm:justify-start">
                <Calendar className="w-3.5 h-3.5" />
                Net Business Status ({range})
              </span>
              <h2 className="text-3xl font-black">
                {data.summary.isProfit ? "NET PROFIT: " : "NET LOSS: "} ৳{" "}
                {Math.abs(data.summary.netProfitOrLoss).toLocaleString()}
              </h2>
              <p className="text-xs text-white/80">
                Gross Income: ৳{data.summary.grossProfit.toLocaleString()} | Total Expenses: ৳
                {data.summary.totalExpenses.toLocaleString()}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 flex items-center gap-3">
              {data.summary.isProfit ? (
                <div className="w-10 h-10 rounded-full bg-white text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-white text-rose-600 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6" />
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold block uppercase text-white/80">Performance Status</span>
                <span className="font-bold text-sm">
                  {data.summary.isProfit ? "Healthy Growth 🚀" : "Expense Exceeding Revenue ⚠️"}
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Total Sales Revenue</span>
              <p className="text-2xl font-black text-slate-900">৳ {data.summary.totalSales.toLocaleString()}</p>
              <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <ShoppingCart className="w-3 h-3" /> {data.summary.totalSalesCount} Orders Completed
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Cash Collected</span>
              <p className="text-2xl font-black text-emerald-600">৳ {data.summary.cashCollected.toLocaleString()}</p>
              <div className="text-[10px] text-slate-400">Immediate liquid cash received</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Due Sales Balance</span>
              <p className="text-2xl font-black text-rose-600">৳ {data.summary.totalDueGiven.toLocaleString()}</p>
              <div className="text-[10px] text-rose-500 font-semibold">Uncollected customer credit</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Total Business Expense</span>
              <p className="text-2xl font-black text-slate-800">৳ {data.summary.totalExpenses.toLocaleString()}</p>
              <div className="text-[10px] text-slate-400">Shop operational costs</div>
            </div>
          </div>

          {/* Profit Source & Expense Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Profit Breakdown by Source */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b pb-3">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Gross Income Streams (লাভের উৎসসমূহ)
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Shop Products Profit</h4>
                      <span className="text-[10px] text-slate-400">Sales Margin (Selling Price - Cost)</span>
                    </div>
                  </div>
                  <span className="font-black text-slate-900 text-sm">৳ {data.summary.posProfit.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">MFS Commissions</h4>
                      <span className="text-[10px] text-slate-400">Bkash, Nagad, Cash-In/Out</span>
                    </div>
                  </div>
                  <span className="font-black text-slate-900 text-sm">৳ {data.summary.mfsProfit.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Flexiload Commission</h4>
                      <span className="text-[10px] text-slate-400">Recharge SIM profit</span>
                    </div>
                  </div>
                  <span className="font-black text-slate-900 text-sm">৳ {data.summary.rechargeProfit.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 2. Highest Expense Categories (কয়টি খাতে সবচেয়ে বেশি খরচ হচ্ছে) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b pb-3">
                <Receipt className="w-4 h-4 text-rose-600" />
                Highest Expense Sectors (সর্বোচ্চ খরচের খাত)
              </h3>

              {data.categoryExpenses.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No expense records recorded in this period.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.categoryExpenses.map((exp, idx) => {
                    const percentage = data.summary.totalExpenses > 0 
                      ? ((exp.amount / data.summary.totalExpenses) * 100).toFixed(1) 
                      : 0;

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between font-bold text-xs text-slate-800">
                          <span>{exp.categoryName}</span>
                          <span className="text-rose-600">৳ {exp.amount.toLocaleString()} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </>
      ) : null}
    </div>
  );
}