"use client";

import { useEffect, useState } from "react";
import { 
  useCashRegisterStore 
} from "../stores/useCashRegisterStore";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Lock, 
  DollarSign, 
  PlusCircle, 
  MinusCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  FileText,
  History
} from "lucide-react";

export default function CashRegisterPage() {
  const { 
    currentRegister, 
    loading, 
    fetchCurrentRegister, 
    openRegister, 
    closeRegister, 
    addTransaction 
  } = useCashRegisterStore();

  // Open Shift Form States
  const [openingBalance, setOpeningBalance] = useState<number | "">(0);
  const [openNote, setOpenNote] = useState("");
  const [isOpening, setIsOpening] = useState(false);

  // Close Shift Form States
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closingBalance, setClosingBalance] = useState<number | "">(0);
  const [closeNote, setCloseNote] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  // Cash In/Out Modal States
  const [trxModalOpen, setTrxModalOpen] = useState(false);
  const [trxType, setTrxType] = useState<"CASH_IN" | "CASH_OUT">("CASH_IN");
  const [trxAmount, setTrxAmount] = useState<number | "">("");
  const [trxReason, setTrxReason] = useState("");
  const [isTrxSubmitting, setIsTrxSubmitting] = useState(false);

  useEffect(() => {
    fetchCurrentRegister();
  }, [fetchCurrentRegister]);

  // ১. শিফট ওপেন সাবমিট
  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (openingBalance === "" || Number(openingBalance) < 0) return;
    setIsOpening(true);
    const success = await openRegister(Number(openingBalance), openNote);
    setIsOpening(false);
    if (success) {
      setOpeningBalance(0);
      setOpenNote("");
    }
  };

  // ২. শিফট ক্লোজ সাবমিট
  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (closingBalance === "" || Number(closingBalance) < 0) return;
    setIsClosing(true);
    const success = await closeRegister(Number(closingBalance), closeNote);
    setIsClosing(false);
    if (success) {
      setCloseModalOpen(false);
      setClosingBalance(0);
      setCloseNote("");
    }
  };

  // ৩. ম্যানুয়াল ক্যাশ ইন/আউট সাবমিট
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxAmount || Number(trxAmount) <= 0 || !trxReason.trim()) return;
    setIsTrxSubmitting(true);
    const success = await addTransaction(trxType, Number(trxAmount), trxReason);
    setIsTrxSubmitting(false);
    if (success) {
      setTrxModalOpen(false);
      setTrxAmount("");
      setTrxReason("");
    }
  };

  // হিসাবসমূহ
  const totalCashIn = currentRegister?.transactions
    ?.filter((t) => t.type === "CASH_IN" || t.type === "PAYMENT")
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  const totalCashOut = currentRegister?.transactions
    ?.filter((t) => t.type === "CASH_OUT" || t.type === "REFUND")
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  const currentExpectedCash = (currentRegister?.openingBalance || 0) + totalCashIn - totalCashOut;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          Loading Cash Register status...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-emerald-600" />
            Cash Register & Shift
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage cash drawer balance, track daily expenses, and reconcile shifts.
          </p>
        </div>

        {currentRegister && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTrxType("CASH_IN");
                setTrxModalOpen(true);
              }}
              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              Cash In / Out
            </button>
            <button
              onClick={() => setCloseModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Lock className="w-4 h-4" />
              Close Shift
            </button>
          </div>
        )}
      </div>

      {/* CASE 1: No Active Shift -> OPEN SHIFT FORM */}
      {!currentRegister ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm max-w-xl mx-auto space-y-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <Wallet className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">No Active Shift Found</h2>
            <p className="text-xs text-slate-500 mt-1">
              Please enter the initial cash amount in your register drawer to open a new shift.
            </p>
          </div>

          <form onSubmit={handleOpenShift} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Opening Cash Balance (BDT) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 2000"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full border border-slate-200 p-3 pl-10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  required
                />
                <DollarSign className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Optional Opening Note
              </label>
              <input
                type="text"
                placeholder="e.g. Started morning shift with change coins"
                value={openNote}
                onChange={(e) => setOpenNote(e.target.value)}
                className="w-full border border-slate-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isOpening}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {isOpening ? <Loader2 className="w-5 h-5 animate-spin" /> : "Open Register Shift"}
            </button>
          </form>
        </div>
      ) : (
        /* CASE 2: Active Shift -> SHIFT DASHBOARD */
        <div className="space-y-6">
          {/* Shift Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Opening Cash</span>
              <p className="text-2xl font-bold text-slate-800">৳ {currentRegister.openingBalance.toLocaleString()}</p>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {new Date(currentRegister.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">Total Cash In</span>
              <p className="text-2xl font-bold text-emerald-600">+ ৳ {totalCashIn.toLocaleString()}</p>
              <span className="text-[11px] text-slate-400">Sales & Manual Additions</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider block">Total Cash Out</span>
              <p className="text-2xl font-bold text-rose-600">- ৳ {totalCashOut.toLocaleString()}</p>
              <span className="text-[11px] text-slate-400">Expenses & Refunds</span>
            </div>

            <div className="bg-emerald-600 p-5 rounded-2xl text-white shadow-md space-y-1">
              <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider block">Current Cash in Drawer</span>
              <p className="text-2xl font-black">৳ {currentExpectedCash.toLocaleString()}</p>
              <span className="text-[11px] text-emerald-200">Expected balance right now</span>
            </div>
          </div>

          {/* Real-time Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                Shift Cash Transactions
              </h3>
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium">
                {currentRegister.transactions.length} Entries
              </span>
            </div>

            {currentRegister.transactions.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                No manual cash transactions or sales yet in this shift.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Reason / Note</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {currentRegister.transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              t.type === "CASH_IN" || t.type === "PAYMENT"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {t.type === "CASH_IN" || t.type === "PAYMENT" ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownLeft className="w-3 h-3" />
                            )}
                            {t.type.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium text-slate-700">{t.reason || "N/A"}</td>
                        <td className="p-3.5 font-bold text-slate-900">৳ {t.amount.toLocaleString()}</td>
                        <td className="p-3.5 text-right text-slate-400">
                          {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Cash In / Cash Out */}
      {trxModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Add Cash In / Cash Out
              </h3>
              <button onClick={() => setTrxModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Transaction Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTrxType("CASH_IN")}
                    className={`p-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 ${
                      trxType === "CASH_IN"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" /> Cash In (Add)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrxType("CASH_OUT")}
                    className={`p-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 ${
                      trxType === "CASH_OUT"
                        ? "bg-rose-50 border-rose-500 text-rose-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <MinusCircle className="w-4 h-4" /> Cash Out (Expense)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Amount (BDT) *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 150"
                  value={trxAmount}
                  onChange={(e) => setTrxAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Reason / Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Tea & Snacks for customer or Change added"
                  value={trxReason}
                  onChange={(e) => setTrxReason(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTrxModalOpen(false)}
                  className="w-1/2 border border-slate-200 py-2.5 rounded-xl text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTrxSubmitting}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all"
                >
                  {isTrxSubmitting ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Shift Close & Difference Reconciliation */}
      {closeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-600" />
                Close Register Shift
              </h3>
              <button onClick={() => setCloseModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Expected Cash in Drawer:</span>
                <span className="font-bold text-slate-900">৳ {currentExpectedCash.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Actual Counted Cash (BDT) *
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Enter counted cash in drawer"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full border border-slate-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                  required
                />
              </div>

              {/* Real-time Discrepancy / Difference Display */}
              {closingBalance !== "" && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    Number(closingBalance) - currentExpectedCash === 0
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      : "bg-amber-50 border border-amber-200 text-amber-800"
                  }`}
                >
                  {Number(closingBalance) - currentExpectedCash === 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>
                    {Number(closingBalance) - currentExpectedCash === 0
                      ? "Cash matches perfectly!"
                      : `Discrepancy: ৳ ${(Number(closingBalance) - currentExpectedCash).toLocaleString()} (Shortage/Excess)`}
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Closing Note / Note on Discrepancy
                </label>
                <input
                  type="text"
                  placeholder="Reason for cash difference if any"
                  value={closeNote}
                  onChange={(e) => setCloseNote(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCloseModalOpen(false)}
                  className="w-1/2 border border-slate-200 py-2.5 rounded-xl text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isClosing}
                  className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all"
                >
                  {isClosing ? "Closing Shift..." : "Confirm & Close Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}