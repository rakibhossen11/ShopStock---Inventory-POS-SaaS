"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Calendar, 
  RefreshCw, 
  Filter,
  Smartphone,
  Award,
  Wallet
} from "lucide-react";

interface DailyCommissionRecord {
  date: string;
  agentCommission: number;
  personalProfit: number;
  total: number;
}

interface SummaryData {
  totalAgentCommission: number;
  totalPersonalProfit: number;
  grandTotalIncome: number;
}

export default function CommissionHistoryPage() {
  const [history, setHistory] = useState<DailyCommissionRecord[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalAgentCommission: 0,
    totalPersonalProfit: 0,
    grandTotalIncome: 0,
  });

  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"today" | "yesterday" | "7days" | "30days" | "thisMonth" | "custom">("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchCommissionData = async () => {
    setLoading(true);
    try {
      let query = `/api/mfs/commission-history?range=${range}`;
      if (range === "custom" && startDate && endDate) {
        query += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await fetch(query);
      const result = await res.json();

      if (result.success) {
        setHistory(result.data.history);
        setSummary(result.data.summary);
      }
    } catch (err) {
      console.error("Failed to load commission history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissionData();
  }, [range]);

  return (
    <div className="max-w-6xl mx-auto my-6 space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Award className="w-7 h-7 text-amber-500" />
            MFS Commission & Profit History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track day-wise MFS agent commissions and personal wallet profits.
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setRange("today")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              range === "today" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setRange("yesterday")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              range === "yesterday" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => setRange("7days")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              range === "7days" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setRange("30days")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              range === "30days" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setRange("thisMonth")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              range === "thisMonth" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setRange("custom")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              range === "custom" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Custom Date Inputs */}
      {range === "custom" && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 text-xs shadow-sm">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-slate-300 p-2 rounded-xl font-bold text-slate-800"
          />
          <span className="font-bold text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-slate-300 p-2 rounded-xl font-bold text-slate-800"
          />
          <button
            onClick={fetchCommissionData}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Filter className="w-4 h-4" /> Apply Filter
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-emerald-600" /> Total Agent Commission
          </span>
          <p className="text-2xl font-black text-emerald-600">
            ৳{summary.totalAgentCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-blue-600" /> Total Personal Profit
          </span>
          <p className="text-2xl font-black text-blue-600">
            ৳{summary.totalPersonalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-400" /> Grand Total Earnings
          </span>
          <p className="text-2xl font-black text-amber-400">
            ৳{summary.grandTotalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Day Wise Commission Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" /> Day-Wise Earnings Breakdown
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex justify-center items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-500" /> Loading Commission Records...
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No commission or profit records found for the selected time period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Agent Commission</th>
                  <th className="p-3.5">Personal Profit</th>
                  <th className="p-3.5 text-right">Total Daily Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {history.map((row) => (
                  <tr key={row.date} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-700">
                      {new Date(row.date).toLocaleDateString("bn-BD", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="p-3.5 font-bold text-emerald-600">
                      +৳{row.agentCommission.toFixed(2)}
                    </td>
                    <td className="p-3.5 font-bold text-blue-600">
                      +৳{row.personalProfit.toFixed(2)}
                    </td>
                    <td className="p-3.5 font-black text-amber-600 text-right">
                      ৳{row.total.toFixed(2)}
                    </td>
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