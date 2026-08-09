"use client";

import { useEffect, useState } from "react";
import { 
  PiggyBank, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Loader2, 
  X, 
  Landmark, 
  HandCoins, 
  Building2 
} from "lucide-react";

export default function InvestmentsPage() {
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [type, setType] = useState<"CAPITAL_IN" | "DRAWING_OUT" | "LOAN_TAKEN" | "LOAN_REPAID">("CAPITAL_IN");
  const [amount, setAmount] = useState<number | "">("");
  const [sourceOrPerson, setSourceOrPerson] = useState("");
  const [assetAccountId, setAssetAccountId] = useState("");
  const [note, setNote] = useState("");

  // Summaries
  const [totalCapital, setTotalCapital] = useState(0);
  const [totalDrawings, setTotalDrawings] = useState(0);
  const [totalLoans, setTotalLoans] = useState(0);

  const fetchInvestments = async () => {
    try {
      const res = await fetch("/api/investments");
      const data = await res.json();
      if (data.success) {
        // Calculation logic for overview cards
      }
    } catch (err) {
      console.error("Error loading investment ledger", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !assetAccountId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: Number(amount),
          sourceOrPerson,
          assetAccountId,
          note,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setAmount("");
        setSourceOrPerson("");
        setNote("");
        fetchInvestments();
      } else {
        alert(data.error || "Failed to record transaction");
      }
    } catch (err) {
      alert("Error submitting transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <PiggyBank className="w-7 h-7 text-emerald-600" />
            Capital & Loan Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track owner investments, personal drawings, and outside business loans.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Capital / Loan Transaction</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
            <Landmark className="w-4 h-4" /> Total Owner Capital
          </div>
          <p className="text-2xl font-black text-slate-900">৳ {totalCapital.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400">Total invested in business</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold">
            <HandCoins className="w-4 h-4" /> Owner Drawings
          </div>
          <p className="text-2xl font-black text-slate-900">৳ {totalDrawings.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400">Withdrawn by owner</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold">
            <Building2 className="w-4 h-4" /> Active Business Loans
          </div>
          <p className="text-2xl font-black text-slate-900">৳ {totalLoans.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400">Outside liabilities</span>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-emerald-600" />
                Record Capital / Loan
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Transaction Type *</label>
                <select
                  value={type}
                  onChange={(e: any) => setType(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="CAPITAL_IN">Owner Capital Investment (+) </option>
                  <option value="DRAWING_OUT">Owner Personal Withdrawal (-) </option>
                  <option value="LOAN_TAKEN">Outside Loan Taken (+)</option>
                  <option value="LOAN_REPAID">Loan Repaid (-)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Source / Person Name</label>
                <input
                  type="text"
                  placeholder="e.g. Owner Name, Bank, Friend"
                  value={sourceOrPerson}
                  onChange={(e) => setSourceOrPerson(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Amount (BDT) *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/2 border border-slate-200 py-2.5 rounded-xl font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  {isSubmitting ? "Recording..." : "Save Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}