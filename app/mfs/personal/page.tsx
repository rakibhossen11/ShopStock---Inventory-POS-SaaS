"use client";

import { useEffect, useState } from "react";
import { 
  Smartphone, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  X, 
  Wallet, 
  Edit3, 
  Save 
} from "lucide-react";

interface PersonalWallet {
  id: string;
  providerName: string;
  accountNumber: string;
  openingBalance: number;
  currentBalance: number;
}

export default function PersonalWalletPage() {
  const [wallets, setWallets] = useState<PersonalWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");

  // Modal State
  const [addWalletModal, setAddWalletModal] = useState(false);

  // Form States
  const [providerName, setProviderName] = useState("Bkash");
  const [accountNumber, setAccountNumber] = useState("");
  const [openingBalance, setOpeningBalance] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline Editing States
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState<number>(0);
  const [editAccountNum, setEditAccountNum] = useState<string>("");

  const fetchWallets = async () => {
    try {
      const res = await fetch("/api/mfs/personal");
      const data = await res.json();
      if (data.success) {
        setWallets(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch personal wallets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  // ১. নতুন পার্সোনাল ওয়ালেট অ্যাড করা
  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/mfs/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerName,
          accountNumber,
          openingBalance: Number(openingBalance) || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Personal wallet added successfully!");
        setAddWalletModal(false);
        setAccountNumber("");
        setOpeningBalance("");
        fetchWallets();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert(data.error || "Failed to create wallet");
      }
    } catch (err) {
      alert("Error adding wallet");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ২. ইনলাইন ব্যালেন্স ও ওয়ালেট ডিটেইলস আপডেট
  const handleInlineUpdate = async (walletId: string) => {
    try {
      const res = await fetch("/api/mfs/personal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: walletId,
          currentBalance: editBalance,
          accountNumber: editAccountNum,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditingWalletId(null);
        setSuccessMsg("Wallet balance updated successfully!");
        fetchWallets();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert(data.error || "Failed to update wallet");
      }
    } catch (err) {
      alert("Error updating wallet");
    }
  };

  const startEditing = (wallet: PersonalWallet) => {
    setEditingWalletId(wallet.id);
    setEditBalance(wallet.currentBalance);
    setEditAccountNum(wallet.accountNumber);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          Loading Personal Wallets...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-6 space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Smartphone className="w-7 h-7 text-blue-600" />
            Personal MFS Wallets
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Add personal accounts and manage running wallet balances easily.
          </p>
        </div>

        <button
          onClick={() => setAddWalletModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Personal Wallet</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Wallet Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-600" /> Active Personal Wallets
          </h3>
          <span className="text-xs text-slate-400">Click Edit to change balance or phone number</span>
        </div>

        {wallets.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No personal wallets added yet. Click "Add Personal Wallet" to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Provider</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Initial Balance</th>
                  <th className="p-4">Current Balance (BDT)</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {wallets.map((w) => {
                  const isEditing = editingWalletId === w.id;

                  return (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-900 text-sm">
                        {w.providerName}
                      </td>

                      <td className="p-4 font-mono text-slate-600">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editAccountNum}
                            onChange={(e) => setEditAccountNum(e.target.value)}
                            className="w-32 border border-blue-400 p-1 rounded-lg text-xs font-mono focus:outline-none"
                          />
                        ) : (
                          w.accountNumber
                        )}
                      </td>

                      <td className="p-4 font-mono text-slate-400">
                        ৳{w.openingBalance.toLocaleString()}
                      </td>

                      <td className="p-4">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editBalance}
                            onChange={(e) => setEditBalance(Number(e.target.value))}
                            className="w-32 border border-blue-500 p-1.5 rounded-lg text-xs font-bold text-blue-700 focus:outline-none bg-blue-50/40"
                          />
                        ) : (
                          <span className="text-blue-600 font-black text-sm">
                            ৳{w.currentBalance.toLocaleString()}
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        {isEditing ? (
                          <button
                            onClick={() => handleInlineUpdate(w.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors inline-flex items-center gap-1"
                          >
                            <Save className="w-3.5 h-3.5" /> Save
                          </button>
                        ) : (
                          <button
                            onClick={() => startEditing(w)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Add New Personal Wallet */}
      {addWalletModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                Add Personal MFS Wallet
              </h3>
              <button onClick={() => setAddWalletModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWallet} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">MFS Provider Name *</label>
                <select
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                >
                  <option value="Bkash">Bkash (Personal)</option>
                  <option value="Nagad">Nagad (Personal)</option>
                  <option value="Rocket">Rocket (Personal)</option>
                  <option value="CellFin">CellFin / Upay</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Personal Phone Number *</label>
                <input
                  type="text"
                  placeholder="01700000000"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Initial Balance (BDT)</label>
                <input
                  type="number"
                  placeholder="0 (If starting empty)"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-700"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddWalletModal(false)}
                  className="w-1/2 border border-slate-200 py-2.5 rounded-xl font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all"
                >
                  {isSubmitting ? "Creating..." : "Save Wallet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}