"use client";

import { useEffect, useState } from "react";
import { 
  Smartphone, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  Save,
  History,
  Clock,
  Filter,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet
} from "lucide-react";

interface DailyStockSubItem {
  id: string;
  endingBalance: number;
  entryDate: string;
}

interface WalletItem {
  id: string;
  providerName: string;
  accountNumber: string;
  currentBalance: number;
  dailyStocks?: DailyStockSubItem[];
}

interface StockHistoryItem {
  id: string;
  walletCategory: "AGENT" | "PERSONAL";
  entryDate: string;
  totalIn: number;
  totalOut: number;
  totalProfit: number;
  endingBalance: number;
  agentWalletId?: string;
  personalWalletId?: string;
  note?: string;
  agentWallet?: {
    providerName: string;
    accountNumber: string;
  };
  personalWallet?: {
    providerName: string;
    accountNumber: string;
  };
}

export default function MfsStockPage() {
  const [agentWallets, setAgentWallets] = useState<WalletItem[]>([]);
  const [personalWallets, setPersonalWallets] = useState<WalletItem[]>([]);
  const [history, setHistory] = useState<StockHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Category Selector ("AGENT" | "PERSONAL")
  const [walletCategory, setWalletCategory] = useState<"AGENT" | "PERSONAL">("AGENT");

  // Filter States
  const [dateRange, setDateRange] = useState<"7days" | "30days" | "all" | "custom">("7days");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Helper Function for Today's Date in YYYY-MM-DD
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper Function to Format Date as DD/MM/YYYY
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

  // Form States
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [entryDate, setEntryDate] = useState<string>("");
  const [totalIn, setTotalIn] = useState<number | "">("");
  const [totalOut, setTotalOut] = useState<number | "">("");
  const [totalProfit, setTotalProfit] = useState<number | "">("");
  const [endingBalance, setEndingBalance] = useState<number | "">("");
  const [note, setNote] = useState("");

  // Mount হওয়ার সময় অটোমেটিক বর্তমান তারিখ সেট হবে
  useEffect(() => {
    setEntryDate(getTodayDateString());
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let queryUrl = `/api/mfs/stock?range=${dateRange}`;
      if (dateRange === "custom" && filterStartDate && filterEndDate) {
        queryUrl += `&startDate=${filterStartDate}&endDate=${filterEndDate}`;
      }

      const res = await fetch(queryUrl);
      const data = await res.json();
      if (data.success) {
        const fetchedAgentWallets = data.data.agentWallets || [];
        const fetchedPersonalWallets = data.data.personalWallets || [];
        setAgentWallets(fetchedAgentWallets);
        setPersonalWallets(fetchedPersonalWallets);
        setHistory(data.data.history || []);

        if (walletCategory === "AGENT" && fetchedAgentWallets.length > 0) {
          setSelectedWalletId((prev) => (prev ? prev : fetchedAgentWallets[0].id));
        } else if (walletCategory === "PERSONAL" && fetchedPersonalWallets.length > 0) {
          setSelectedWalletId((prev) => (prev ? prev : fetchedPersonalWallets[0].id));
        }
      }
    } catch (err) {
      console.error("Failed to fetch stock data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const handleCategoryChange = (cat: "AGENT" | "PERSONAL") => {
    setWalletCategory(cat);
    if (cat === "AGENT" && agentWallets.length > 0) {
      setSelectedWalletId(agentWallets[0].id);
    } else if (cat === "PERSONAL" && personalWallets.length > 0) {
      setSelectedWalletId(personalWallets[0].id);
    } else {
      setSelectedWalletId("");
    }
  };

  const activeWalletsList = walletCategory === "AGENT" ? agentWallets : personalWallets;
  const currentSelectedWallet = activeWalletsList.find((w) => w.id === selectedWalletId);
  const lastStockEntry = currentSelectedWallet?.dailyStocks?.[0];

  // ১. বর্তমান ক্যাটাগরি ভিত্তিক ফিল্টারড হিস্ট্রি
  const filteredHistory = history.filter((item) => item.walletCategory === walletCategory);

  // ২. ইন, আউট ও প্রফিট সামারি হিসাব
  const totalInSum = filteredHistory.reduce((sum, item) => sum + (Number(item.totalIn) || 0), 0);
  const totalOutSum = filteredHistory.reduce((sum, item) => sum + (Number(item.totalOut) || 0), 0);
  const totalProfitSum = filteredHistory.reduce((sum, item) => sum + (Number(item.totalProfit) || 0), 0);

  // ৩. ওয়ালেট ভিত্তিক রিসেন্ট সমাপনী জের সামারি (Total Ending Balance)
  const latestWalletBalances: Record<string, number> = {};
  filteredHistory.forEach((item) => {
    const wId = item.walletCategory === "AGENT" ? item.agentWalletId : item.personalWalletId;
    if (wId && !(wId in latestWalletBalances)) {
      latestWalletBalances[wId] = Number(item.endingBalance) || 0;
    }
  });
  const totalEndingBalanceSum = Object.values(latestWalletBalances).reduce((a, b) => a + b, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWalletId) {
      alert("Please select a wallet.");
      return;
    }
    if (endingBalance === "" || isNaN(Number(endingBalance))) {
      alert("Please enter a valid ending balance.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/mfs/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletCategory,
          agentWalletId: walletCategory === "AGENT" ? selectedWalletId : undefined,
          personalWalletId: walletCategory === "PERSONAL" ? selectedWalletId : undefined,
          entryDate: entryDate || getTodayDateString(),
          totalIn: totalIn === "" ? 0 : Number(totalIn),
          totalOut: totalOut === "" ? 0 : Number(totalOut),
          totalProfit: totalProfit === "" ? 0 : Number(totalProfit),
          endingBalance: Number(endingBalance),
          note,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || "Stock entry saved successfully!");
        setTotalIn("");
        setTotalOut("");
        setTotalProfit("");
        setEndingBalance("");
        setNote("");
        fetchData();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        alert(data.error || "Failed to save stock entry");
      }
    } catch (err) {
      alert("Error saving stock entry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto my-6 space-y-6 pb-12 text-xs">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Smartphone className="w-7 h-7 text-emerald-600" />
            MFS Daily Stock Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Input daily summary & day-end balance for both Agent and Personal Wallets.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => handleCategoryChange("AGENT")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              walletCategory === "AGENT" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Agent Wallets
          </button>
          <button
            type="button"
            onClick={() => handleCategoryChange("PERSONAL")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              walletCategory === "PERSONAL" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Personal Wallets
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" /> 
            {walletCategory === "AGENT" ? "Agent" : "Personal"} Daily Stock Entry
          </h3>

          {/* Last Entry Info Card */}
          {currentSelectedWallet && (
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Current Running Balance:</span>
                <span className="font-bold text-slate-900">৳{currentSelectedWallet.currentBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-medium border-t border-slate-100 pt-1">
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3" /> Last Entry Date:
                </span>
                <span className="font-bold text-blue-600">
                  {lastStockEntry ? formatDateDMY(lastStockEntry.entryDate) : "No Entry Yet"}
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {/* Wallet Select */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Select {walletCategory === "AGENT" ? "Agent" : "Personal"} Wallet *
              </label>
              <select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                {activeWalletsList.length === 0 ? (
                  <option value="">No Wallets Found</option>
                ) : (
                  activeWalletsList.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.providerName} ({w.accountNumber}) — Bal: ৳{w.currentBalance.toLocaleString()}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Date Select */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Entry Date *</label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Inflow */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {walletCategory === "AGENT" ? "Total Cash In Today (BDT)" : "Total E-Money Received Today (BDT)"}
              </label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={totalIn}
                onChange={(e) => setTotalIn(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Outflow */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {walletCategory === "AGENT" ? "Total Cash Out Today (BDT)" : "Total E-Money Sent Today (BDT)"}
              </label>
              <input
                type="number"
                placeholder="e.g. 30000"
                value={totalOut}
                onChange={(e) => setTotalOut(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Profit / Commission */}
            <div>
              <label className="font-bold text-emerald-700 block mb-1">
                {walletCategory === "AGENT" ? "Total Commission Earned (BDT)" : "Extra Profit / Gain Earned (BDT)"}
              </label>
              <input
                type="number"
                placeholder="e.g. 320"
                value={totalProfit}
                onChange={(e) => setTotalProfit(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full border border-emerald-300 bg-emerald-50/50 p-2.5 rounded-xl text-xs font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Ending E-Money Balance */}
            <div>
              <label className="font-bold text-blue-700 block mb-1">Day-End SIM Balance (BDT) *</label>
              <input
                type="number"
                placeholder="e.g. 45000"
                value={endingBalance}
                onChange={(e) => setEndingBalance(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full border border-blue-300 bg-blue-50/50 p-2.5 rounded-xl text-xs font-bold text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Note */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Note (Optional)</label>
              <input
                type="text"
                placeholder="Short note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs shadow-xs cursor-pointer ${
                walletCategory === "AGENT" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {submitting ? "Saving Entry..." : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Stock Entry</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* History Table Container */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* History Filter Header */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" /> 
                {walletCategory === "AGENT" ? "Agent" : "Personal"} Daily Stock Records
              </h3>

              {/* Date Filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDateRange("7days")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    dateRange === "7days" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setDateRange("30days")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    dateRange === "30days" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  type="button"
                  onClick={() => setDateRange("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    dateRange === "all" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setDateRange("custom")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    dateRange === "custom" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Custom Date Range Selectors */}
            {dateRange === "custom" && (
              <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="border border-slate-300 p-1.5 rounded-lg font-bold bg-white"
                />
                <span className="text-slate-500 font-bold">to</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="border border-slate-300 p-1.5 rounded-lg font-bold bg-white"
                />
                <button
                  type="button"
                  onClick={fetchData}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" /> Apply Filter
                </button>
              </div>
            )}

            {/* সামারি কার্ডস */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/60 border-b border-slate-100">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> Total In Flow
                </span>
                <p className="text-base font-black text-emerald-600">৳{totalInSum.toLocaleString()}</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-rose-600" /> Total Out Flow
                </span>
                <p className="text-base font-black text-rose-600">৳{totalOutSum.toLocaleString()}</p>
              </div>

              <div className="bg-amber-500/10 border border-amber-200/80 p-3 rounded-xl shadow-2xs space-y-0.5">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-amber-600" /> Total Profit
                </span>
                <p className="text-base font-black text-amber-700">৳{totalProfitSum.toLocaleString()}</p>
              </div>

              <div className="bg-blue-600 text-white p-3 rounded-xl shadow-2xs space-y-0.5">
                <span className="text-[10px] font-bold text-blue-100 uppercase tracking-wider block flex items-center gap-1">
                  <Wallet className="w-3 h-3 text-blue-200" /> Total End Balance
                </span>
                <p className="text-base font-black text-white">৳{totalEndingBalanceSum.toLocaleString()}</p>
              </div>
            </div>

            {/* Table Content */}
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs flex justify-center items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" /> Loading Stock History...
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No {walletCategory.toLowerCase()} stock entries found for the selected date range.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-3">Date</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Wallet</th>
                      <th className="p-3">In Flow</th>
                      <th className="p-3">Out Flow</th>
                      <th className="p-3">Profit/Comm.</th>
                      <th className="p-3 text-right">Ending Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredHistory.map((item) => {
                      const walletInfo = item.walletCategory === "AGENT" ? item.agentWallet : item.personalWallet;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-semibold text-slate-600">
                            {formatDateDMY(item.entryDate)}
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              item.walletCategory === "AGENT" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                            }`}>
                              {item.walletCategory}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            {walletInfo ? `${walletInfo.providerName} (${walletInfo.accountNumber})` : "N/A"}
                          </td>
                          <td className="p-3 font-bold text-emerald-600">
                            ৳{Number(item.totalIn || 0).toLocaleString()}
                          </td>
                          <td className="p-3 font-bold text-rose-600">
                            ৳{Number(item.totalOut || 0).toLocaleString()}
                          </td>
                          <td className="p-3 font-bold text-amber-600">
                            ৳{Number(item.totalProfit || 0).toLocaleString()}
                          </td>
                          <td className="p-3 font-black text-blue-600 text-right">
                            ৳{Number(item.endingBalance || 0).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* টেবিলের নিচে গ্র্যান্ড টোটাল ও Ending Balance রো */}
                  <tfoot>
                    <tr className="bg-slate-100/80 font-black text-slate-900 border-t-2 border-slate-200">
                      <td colSpan={3} className="p-3 text-slate-700 uppercase tracking-wider text-[11px]">
                        Period Summary Total:
                      </td>
                      <td className="p-3 text-emerald-700">৳{totalInSum.toLocaleString()}</td>
                      <td className="p-3 text-rose-700">৳{totalOutSum.toLocaleString()}</td>
                      <td className="p-3 text-amber-700">৳{totalProfitSum.toLocaleString()}</td>
                      <td className="p-3 text-right text-blue-700">৳{totalEndingBalanceSum.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}