"use client";

import { useEffect, useState } from "react";
import { 
  Smartphone, 
  Plus, 
  ShoppingCart, 
  History, 
  CheckCircle2, 
  RefreshCw, 
  DollarSign, 
  Calendar, 
  Save, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Clock, 
  ShieldCheck,
  Search,
  ChevronRight
} from "lucide-react";

interface RechargeSim {
  id: string;
  operatorName: string;
  simNumber: string;
  currentBalance: number;
  dailyBalances?: any[];
}

export default function ProfessionalRechargePage() {
  const [activeTab, setActiveTab] = useState<"SIMS" | "PURCHASE" | "DAY_END" | "HISTORY_LOGS">("SIMS");
  const [sims, setSims] = useState<RechargeSim[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  // Filter & Selected SIM for History Tracking
  const [historySimFilter, setHistorySimFilter] = useState<string>("ALL");

  // Form States
  const [operator, setOperator] = useState("Grameenphone");
  const [simPhone, setSimPhone] = useState("");
  const [initialBal, setInitialBal] = useState<number | "">("");

  const [selectedSimId, setSelectedSimId] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState<number | "">("");
  const [commissionAmount, setCommissionAmount] = useState<number | "">("");
  
  const [endingBal, setEndingBal] = useState<number | "">("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/recharge");
      const data = await res.json();
      if (data.success) {
        setSims(data.data.sims || []);
        setPurchases(data.data.purchases || []);
        setHistoryLogs(data.data.historyLogs || []);

        if (data.data.sims.length > 0 && !selectedSimId) {
          setSelectedSimId(data.data.sims[0].id);
        }
      }
    } catch (e) {
      console.error("Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Operator Badge & Color Mapper
  const getOperatorStyle = (name: string) => {
    switch (name.toLowerCase()) {
      case "grameenphone": return { bg: "bg-blue-50 border-blue-200 text-blue-700", badge: "bg-blue-600 text-white" };
      case "robi": return { bg: "bg-rose-50 border-rose-200 text-rose-700", badge: "bg-rose-600 text-white" };
      case "banglalink": return { bg: "bg-amber-50 border-amber-200 text-amber-700", badge: "bg-amber-500 text-white" };
      case "airtel": return { bg: "bg-red-50 border-red-200 text-red-700", badge: "bg-red-600 text-white" };
      case "teletalk": return { bg: "bg-emerald-50 border-emerald-200 text-emerald-700", badge: "bg-emerald-600 text-white" };
      default: return { bg: "bg-slate-50 border-slate-200 text-slate-700", badge: "bg-slate-800 text-white" };
    }
  };

  const handleAddSim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ADD_SIM", operatorName: operator, simNumber: simPhone, amount: initialBal }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg("New Flexi SIM added successfully!");
        setSimPhone(""); setInitialBal(""); fetchData();
        setTimeout(() => setMsg(""), 3500);
      }
    } catch (e) { alert("Error adding SIM"); }
    setSubmitting(false);
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSimId || !purchaseAmount) return alert("Select SIM and enter purchase amount.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PURCHASE",
          simId: selectedSimId,
          amount: purchaseAmount,
          commission: commissionAmount,
          note
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg("Recharge balance added to SIM successfully!");
        setPurchaseAmount(""); setCommissionAmount(""); setNote(""); fetchData();
        setTimeout(() => setMsg(""), 3500);
      }
    } catch (e) { alert("Error purchasing stock"); }
    setSubmitting(false);
  };

  const handleDayEnd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSimId || endingBal === "") return alert("Select SIM and enter remaining balance.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DAY_END_BALANCE",
          simId: selectedSimId,
          endingBalance: endingBal,
          entryDate,
          note
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg("Day-end closing balance updated!");
        setEndingBal(""); setNote(""); fetchData();
        setTimeout(() => setMsg(""), 3500);
      }
    } catch (e) { alert("Error saving day-end stock"); }
    setSubmitting(false);
  };

  const totalLiveRechargeAssets = sims.reduce((acc, s) => acc + s.currentBalance, 0);
  const totalCommissionEarned = purchases.reduce((acc, p) => acc + p.commission, 0);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" /> Loading Flexiload System...
        </div>
      </div>
    );
  }

  const selectedSimForDayEnd = sims.find(s => s.id === selectedSimId);

  // Filter history logs for tracking
  const filteredHistoryLogs = historySimFilter === "ALL" 
    ? historyLogs 
    : historyLogs.filter(log => log.simId === historySimFilter);

  return (
    <div className="max-w-6xl mx-auto my-6 space-y-6 pb-12 text-xs">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-600/20 rounded-xl text-blue-400 border border-blue-500/30">
              <Zap className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black tracking-tight">Flexiload & Recharge Management</h1>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Track daily flexi SIM balances, commission gains, and automatic sales reconciliation.
          </p>
        </div>

        {/* Quick Stats Banner */}
        <div className="flex gap-4 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 font-bold">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Total SIM Assets</span>
            <span className="text-emerald-400 text-base font-black">৳{totalLiveRechargeAssets.toLocaleString()} BDT</span>
          </div>
          <div className="border-l border-slate-700 pl-4">
            <span className="text-[10px] text-slate-400 uppercase block">Total Commission</span>
            <span className="text-amber-400 text-base font-black">৳{totalCommissionEarned.toLocaleString()} BDT</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 font-bold">
          <button
            onClick={() => setActiveTab("SIMS")}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "SIMS" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Smartphone className="w-4 h-4" /> SIM Accounts ({sims.length})
          </button>
          <button
            onClick={() => setActiveTab("PURCHASE")}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "PURCHASE" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ShoppingCart className="w-4 h-4" /> Buy Stock (Lafa)
          </button>
          <button
            onClick={() => setActiveTab("DAY_END")}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "DAY_END" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-4 h-4" /> Day-End Stock Entry
          </button>
          <button
            onClick={() => setActiveTab("HISTORY_LOGS")}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "HISTORY_LOGS" ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <History className="w-4 h-4" /> SIM History & Trends
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold rounded-xl flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* TAB 1: SIM MANAGEMENT */}
      {activeTab === "SIMS" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handleAddSim} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" /> Add New Recharge SIM
            </h3>

            <div>
              <label className="font-bold block mb-1 text-slate-700">Operator *</label>
              <select value={operator} onChange={(e) => setOperator(e.target.value)} className="w-full border p-2.5 rounded-xl font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Grameenphone">Grameenphone</option>
                <option value="Robi">Robi</option>
                <option value="Banglalink">Banglalink</option>
                <option value="Airtel">Airtel</option>
                <option value="Teletalk">Teletalk</option>
              </select>
            </div>

            <div>
              <label className="font-bold block mb-1 text-slate-700">SIM Phone Number *</label>
              <input type="text" placeholder="01700000000" value={simPhone} onChange={(e) => setSimPhone(e.target.value)} className="w-full border p-2.5 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>

            <div>
              <label className="font-bold block mb-1 text-slate-700">Initial Balance (BDT)</label>
              <input type="number" placeholder="0.00" value={initialBal} onChange={(e) => setInitialBal(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border p-2.5 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-sm">
              {submitting ? "Saving..." : "Save Recharge SIM"}
            </button>
          </form>

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sims.length === 0 ? (
              <div className="col-span-2 bg-white p-12 text-center text-slate-400 rounded-2xl border">
                No recharge SIMs added yet. Add your first flexi SIM using the form.
              </div>
            ) : (
              sims.map((sim) => {
                const style = getOperatorStyle(sim.operatorName);
                const lastLog = sim.dailyBalances?.[0];

                return (
                  <div key={sim.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{sim.operatorName}</span>
                        <span className="text-slate-500 font-mono text-xs">{sim.simNumber}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${style.badge}`}>
                        {sim.operatorName.toUpperCase()}
                      </span>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <span className="text-[11px] text-slate-400 font-medium block">Live E-Money Balance</span>
                      <p className="text-2xl font-black text-slate-900">৳{sim.currentBalance.toLocaleString()}</p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-500 flex justify-between font-semibold">
                      <span>Last Entry: {lastLog ? new Date(lastLog.entryDate).toLocaleDateString() : "No record"}</span>
                      {lastLog && <span className="text-blue-600 font-bold">End Bal: ৳{lastLog.endingBalance}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BUY STOCK */}
      {activeTab === "PURCHASE" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handlePurchase} className="md:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-emerald-600" /> Buy Recharge Stock (Lafa)
            </h3>

            <div>
              <label className="font-bold block mb-1 text-slate-700">Select SIM *</label>
              <select value={selectedSimId} onChange={(e) => setSelectedSimId(e.target.value)} className="w-full border p-2.5 rounded-xl font-bold bg-white focus:outline-none">
                {sims.map((s) => <option key={s.id} value={s.id}>{s.operatorName} ({s.simNumber}) — Bal: ৳{s.currentBalance}</option>)}
              </select>
            </div>

            <div>
              <label className="font-bold block mb-1 text-slate-700">Amount Purchased (BDT) *</label>
              <input type="number" placeholder="e.g. 5000" value={purchaseAmount} onChange={(e) => setPurchaseAmount(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border p-2.5 rounded-xl font-bold focus:outline-none" required />
            </div>

            <div>
              <label className="font-bold text-emerald-700 block mb-1">Commission Earned / Bonus (BDT)</label>
              <input type="number" placeholder="e.g. 135" value={commissionAmount} onChange={(e) => setCommissionAmount(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-emerald-300 bg-emerald-50/50 p-2.5 rounded-xl font-bold text-emerald-800 focus:outline-none" />
            </div>

            <div>
              <label className="font-bold block mb-1 text-slate-700">Note (Optional)</label>
              <input type="text" placeholder="Bought via Lafa Agent..." value={note} onChange={(e) => setNote(e.target.value)} className="w-full border p-2.5 rounded-xl focus:outline-none" />
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-sm">
              {submitting ? "Processing..." : "Purchase & Add To SIM Balance"}
            </button>
          </form>

          {/* Recent Stock Purchases Table */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b font-bold text-slate-800">
              Recent Recharge Stock Purchases
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-[11px] font-bold text-slate-500 uppercase">
                    <th className="p-3">Date</th>
                    <th className="p-3">SIM</th>
                    <th className="p-3">Bought</th>
                    <th className="p-3">Commission</th>
                    <th className="p-3 text-right">Total Balance Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs">
                  {purchases.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">No stock purchase history found.</td></tr>
                  ) : (
                    purchases.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-semibold text-slate-600">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 font-bold text-slate-900">{p.sim?.operatorName} ({p.sim?.simNumber})</td>
                        <td className="p-3 font-bold text-slate-800">৳{p.amount.toLocaleString()}</td>
                        <td className="p-3 font-bold text-emerald-600">+৳{p.commission.toLocaleString()}</td>
                        <td className="p-3 font-black text-blue-600 text-right">৳{p.totalReceived.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DAY-END STOCK */}
      {activeTab === "DAY_END" && (
        <form onSubmit={handleDayEnd} className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-600" /> Day-End SIM Balance Input & Auto Sales Reconciliation
          </h3>

          {selectedSimForDayEnd && (
            <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-xl text-indigo-900 flex justify-between font-bold">
              <span>Current System Balance:</span>
              <span className="text-base">৳{selectedSimForDayEnd.currentBalance.toLocaleString()} BDT</span>
            </div>
          )}

          <div>
            <label className="font-bold block mb-1 text-slate-700">Select SIM *</label>
            <select value={selectedSimId} onChange={(e) => setSelectedSimId(e.target.value)} className="w-full border p-2.5 rounded-xl font-bold bg-white focus:outline-none">
              {sims.map((s) => <option key={s.id} value={s.id}>{s.operatorName} ({s.simNumber}) — Bal: ৳{s.currentBalance}</option>)}
            </select>
          </div>

          <div>
            <label className="font-bold block mb-1 text-slate-700">Entry Date *</label>
            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="w-full border p-2.5 rounded-xl font-bold focus:outline-none" required />
          </div>

          <div>
            <label className="font-bold text-indigo-700 block mb-1">Actual SIM Balance Remaining Tonight (BDT) *</label>
            <input type="number" placeholder="e.g. 1200" value={endingBal} onChange={(e) => setEndingBal(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-indigo-300 bg-indigo-50/50 p-2.5 rounded-xl font-bold text-indigo-900 focus:outline-none" required />
          </div>

          <div>
            <label className="font-bold block mb-1 text-slate-700">Note (Optional)</label>
            <input type="text" placeholder="Closing note..." value={note} onChange={(e) => setNote(e.target.value)} className="w-full border p-2.5 rounded-xl focus:outline-none" />
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm">
            {submitting ? "Saving Closing..." : "Save Day-End Stock & Calculate Sales"}
          </button>
        </form>
      )}

      {/* TAB 4: SIM HISTORY & TRENDS (ইউজার জানতে পারবে ৭ দিন আগে কত ব্যালেন্স ছিল) */}
      {activeTab === "HISTORY_LOGS" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600" /> Historical SIM Balance & Daily Sales Timeline
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Check historical end-of-day balances and calculated flexiload sales for any SIM.
              </p>
            </div>

            {/* SIM Filter */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500">Filter SIM:</span>
              <select
                value={historySimFilter}
                onChange={(e) => setHistorySimFilter(e.target.value)}
                className="border p-2 rounded-xl font-bold bg-white focus:outline-none text-xs"
              >
                <option value="ALL">All SIM Accounts</option>
                {sims.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.operatorName} ({s.simNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b text-[11px] font-bold text-slate-500 uppercase">
                  <th className="p-3">Date</th>
                  <th className="p-3">SIM Account</th>
                  <th className="p-3">Day-End SIM Balance</th>
                  <th className="p-3 text-right">Calculated Flexi Sales Today</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {filteredHistoryLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-400">
                      No historical day-end records found for the selected SIM.
                    </td>
                  </tr>
                ) : (
                  filteredHistoryLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-slate-700">
                        {new Date(log.entryDate).toLocaleDateString("bn-BD", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {log.sim?.operatorName} ({log.sim?.simNumber})
                      </td>
                      <td className="p-3 font-black text-blue-600">
                        ৳{log.endingBalance.toLocaleString()}
                      </td>
                      <td className="p-3 font-black text-emerald-600 text-right">
                        ৳{log.calculatedSell.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}