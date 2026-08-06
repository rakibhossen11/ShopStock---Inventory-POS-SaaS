"use client";

import { useEffect, useState } from "react";
import { 
  Calculator, 
  RefreshCw, 
  CheckCircle2, 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  Smartphone,
  Save
} from "lucide-react";

interface WalletItem {
  id: string;
  providerName: string;
  accountNumber: string;
  currentBalance: number;
}

export default function DayClosePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Summary Data from API
  const [openingCash, setOpeningCash] = useState(0);
  const [systemCalculatedCash, setSystemCalculatedCash] = useState(0);
  const [salesSummary, setSalesSummary] = useState({
    cashInTotal: 0,
    cashOutTotal: 0,
    agentCommission: 0,
    personalExtraProfit: 0,
    totalSellEntries: 0,
  });

  // User Manual Input States
  const [actualCashInput, setActualCashInput] = useState<number | "">("");
  const [agentWallets, setAgentWallets] = useState<WalletItem[]>([]);
  const [personalWallets, setPersonalWallets] = useState<WalletItem[]>([]);
  const [agentCommissionInput, setAgentCommissionInput] = useState<number | "">("");
  const [personalExtraInput, setPersonalExtraInput] = useState<number | "">("");
  const [note, setNote] = useState("");

  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/mfs/day-close");
      const data = await res.json();
      if (data.success) {
        setOpeningCash(data.data.openingCash);
        setSystemCalculatedCash(data.data.systemCalculatedCash);
        setActualCashInput(data.data.systemCalculatedCash);
        setSalesSummary(data.data.todaySalesSummary);

        setAgentWallets(data.data.agentWallets);
        setPersonalWallets(data.data.personalWallets);

        setAgentCommissionInput(data.data.todaySalesSummary.agentCommission);
        setPersonalExtraInput(data.data.todaySalesSummary.personalExtraProfit);
      }
    } catch (err) {
      console.error("Failed to fetch summary", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleAgentBalanceChange = (id: string, value: number) => {
    setAgentWallets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, currentBalance: value } : w))
    );
  };

  const handlePersonalBalanceChange = (id: string, value: number) => {
    setPersonalWallets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, currentBalance: value } : w))
    );
  };

  const actualCash = Number(actualCashInput) || 0;
  const discrepancy = actualCash - systemCalculatedCash;

  const totalAgentWalletsSum = agentWallets.reduce((acc, w) => acc + (Number(w.currentBalance) || 0), 0);
  const totalPersonalWalletsSum = personalWallets.reduce((acc, w) => acc + (Number(w.currentBalance) || 0), 0);

  const totalEndingAssets = actualCash + totalAgentWalletsSum + totalPersonalWalletsSum;
  const netDayProfit = (Number(agentCommissionInput) || 0) + (Number(personalExtraInput) || 0) + discrepancy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/mfs/day-close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openingCash,
          closingCash: actualCash,
          systemCalculatedCash,
          agentWalletsInput: agentWallets.map((w) => ({ id: w.id, actualBalance: w.currentBalance })),
          personalWalletsInput: personalWallets.map((w) => ({ id: w.id, actualBalance: w.currentBalance })),
          agentCommissionEarned: Number(agentCommissionInput) || 0,
          personalExtraEarned: Number(personalExtraInput) || 0,
          note,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Day-End closing completed! Tomorrow starting balance saved.");
        fetchSummary();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        alert(data.error || "Failed to process day close");
      }
    } catch (err) {
      alert("Error submitting day close");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          Loading Day-End Reconciliation...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto my-6 space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Calculator className="w-7 h-7 text-blue-600" />
            Day-End Closing & Reconciliation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reconcile daily cash drawer, final wallet balances, and track net profit/loss.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Sell Page Auto Summary Banner */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-blue-900 text-xs">
        <div>
          <span className="font-bold text-sm block">Sell Page Activity Today:</span>
          <p className="text-blue-700 mt-0.5">
            Total {salesSummary.totalSellEntries} entries recorded via Sell Terminal page today.
          </p>
        </div>
        <div className="flex gap-4 font-bold">
          <div>Cash In: <span className="text-emerald-700">৳{salesSummary.cashInTotal}</span></div>
          <div>Cash Out: <span className="text-rose-700">৳{salesSummary.cashOutTotal}</span></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Columns: Input Fields */}
        <div className="md:col-span-2 space-y-6">
          {/* 1. Cash Drawer Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Cash Drawer Reconciliation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium block">System Expected Cash:</span>
                <span className="text-lg font-black text-slate-800">৳{systemCalculatedCash.toLocaleString()}</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Actual Hand Cash Counted *</label>
                <input
                  type="number"
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full border border-slate-300 p-2.5 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {discrepancy !== 0 && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                discrepancy > 0 ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Cash Mismatch: {discrepancy > 0 ? `+৳${discrepancy} Excess Cash` : `-৳${Math.abs(discrepancy)} Cash Shortage`}
                </span>
              </div>
            )}
          </div>

          {/* 2. Agent Wallets Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
              <Smartphone className="w-4 h-4 text-blue-600" /> Agent Wallets Day-End Balance
            </h3>

            <div className="space-y-3">
              {agentWallets.map((w) => (
                <div key={w.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{w.providerName}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{w.accountNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-semibold">Current Balance:</span>
                    <input
                      type="number"
                      value={w.currentBalance}
                      onChange={(e) => handleAgentBalanceChange(w.id, Number(e.target.value))}
                      className="w-28 border border-slate-300 p-1.5 rounded-lg text-xs font-bold text-blue-700 bg-white text-right focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Personal Wallets Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
              <Wallet className="w-4 h-4 text-indigo-600" /> Personal Wallets Day-End Balance
            </h3>

            <div className="space-y-3">
              {personalWallets.map((w) => (
                <div key={w.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{w.providerName}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{w.accountNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-semibold">Current Balance:</span>
                    <input
                      type="number"
                      value={w.currentBalance}
                      onChange={(e) => handlePersonalBalanceChange(w.id, Number(e.target.value))}
                      className="w-28 border border-slate-300 p-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-white text-right focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Commission & Profits Entry */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Daily Earnings & Commissions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Agent Commissions Earned (BDT)</label>
                <input
                  type="number"
                  value={agentCommissionInput}
                  onChange={(e) => setAgentCommissionInput(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full border border-slate-300 p-2.5 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Personal Extra Margin Profit (BDT)</label>
                <input
                  type="number"
                  value={personalExtraInput}
                  onChange={(e) => setPersonalExtraInput(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full border border-slate-300 p-2.5 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Profit Summary & Closing Action */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4 shadow-sm">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              Day-End Assets Summary
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Hand Cash:</span>
                <span className="font-bold text-white">৳{actualCash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Agent Wallets:</span>
                <span className="font-bold text-white">৳{totalAgentWalletsSum.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Personal Wallets:</span>
                <span className="font-bold text-white">৳{totalPersonalWalletsSum.toLocaleString()}</span>
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-between font-bold text-sm">
                <span>Total Ending Assets:</span>
                <span className="text-emerald-400">৳{totalEndingAssets.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Calculated Net Profit Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
              Calculated Net Day Profit
            </h3>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">Net Profit / Loss:</span>
              <span className={`text-xl font-black ${netDayProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                ৳{netDayProfit.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            {submitting ? (
              "Processing Closing..."
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Complete Day-End Closing</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}