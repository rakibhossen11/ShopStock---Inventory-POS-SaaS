"use client";

import { useEffect, useState } from "react";
import { 
  Smartphone, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  Layers, 
  X, 
  Edit3, 
  Save, 
  Phone, 
  Wallet, 
  Percent,
  TrendingUp,
  Tag
} from "lucide-react";

interface MFSAgentWallet {
  id: string;
  providerName: string;
  accountNumber: string;
  accountType: "AGENT" | "MERCHANT" | "PERSONAL";
  openingBalance: number;
  currentBalance: number;
  cashInCommission: number;
  cashOutCommission: number;
}

interface MfsCategory {
  id: string;
  name: string;
  type: string;
}

export default function MFSAgentSetupPage() {
  const [wallets, setWallets] = useState<MFSAgentWallet[]>([]);
  const [categories, setCategories] = useState<MfsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");

  // Modals
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  // Form States
  const [providerName, setProviderName] = useState("Bkash");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState<"AGENT" | "MERCHANT" | "PERSONAL">("AGENT");
  const [openingBalance, setOpeningBalance] = useState<number | "">("");
  const [cashInCommission, setCashInCommission] = useState<number | "">(4.12);
  const [cashOutCommission, setCashOutCommission] = useState<number | "">(4.12);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline Stock Style Editing State
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState<number>(0);
  const [editCashInComm, setEditCashInComm] = useState<number>(0);
  const [editCashOutComm, setEditCashOutComm] = useState<number>(0);

  const fetchMFSData = async () => {
    try {
      const res = await fetch("/api/mfs/agent");
      const result = await res.json();
      if (result.success) {
        setWallets(result.data.wallets);
        setCategories(result.data.categories);
      }
    } catch (err) {
      console.error("Failed to load MFS Data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMFSData();
  }, []);

  // ১. নতুন ওয়ালেট সাবমিট করা
  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim()) {
      alert("Please enter account phone number");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/mfs/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerName,
          accountNumber,
          accountType,
          openingBalance: Number(openingBalance) || 0,
          cashInCommission: Number(cashInCommission) || 0,
          cashOutCommission: Number(cashOutCommission) || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("MFS Agent Wallet created successfully!");
        setWalletModalOpen(false);
        setAccountNumber("");
        setOpeningBalance("");
        fetchMFSData();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert(data.error || "Failed to create wallet");
      }
    } catch (err) {
      alert("Server Connection Error!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ২. স্টক পেজের মতো ব্যালেন্স ও কমিশন ইনলাইন আপডেট করা
  const handleInlineUpdate = async (walletId: string) => {
    try {
      const res = await fetch("/api/mfs/agent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: walletId,
          currentBalance: editBalance,
          cashInCommission: editCashInComm,
          cashOutCommission: editCashOutComm,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditingWalletId(null);
        setSuccessMsg("Wallet updated successfully!");
        fetchMFSData();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert(data.error || "Failed to update wallet");
      }
    } catch (err) {
      alert("Error updating wallet");
    }
  };

  const startEditing = (wallet: MFSAgentWallet) => {
    setEditingWalletId(wallet.id);
    setEditBalance(wallet.currentBalance);
    setEditCashInComm(wallet.cashInCommission);
    setEditCashOutComm(wallet.cashOutCommission);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
          Loading MFS Agent Wallets...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-6 space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Smartphone className="w-7 h-7 text-emerald-600" />
            MFS Agent & Digital Wallets
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage agent wallets (Bkash, Nagad, Rocket), track cash-in/out commissions, and balances.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Categories Modal Button */}
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all"
          >
            <Tag className="w-4 h-4 text-slate-500" />
            <span>MFS Categories ({categories.length})</span>
          </button>

          {/* Add Wallet Button */}
          <button
            onClick={() => setWalletModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Agent Wallet</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* MFS Agent Wallets List Table (Stock-style fast editing) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-600" /> Active MFS Agent Wallets
          </h3>
          <span className="text-xs text-slate-400">Inline Balance & Commission Editing Supported</span>
        </div>

        {wallets.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No agent wallets created yet. Click "Add Agent Wallet" to configure one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Provider / Number</th>
                  <th className="p-4">Account Type</th>
                  <th className="p-4">Initial Balance</th>
                  <th className="p-4">Current Balance (BDT)</th>
                  <th className="p-4">Cash-In Comm. (/1k)</th>
                  <th className="p-4">Cash-Out Comm. (/1k)</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {wallets.map((w) => {
                  const isEditing = editingWalletId === w.id;

                  return (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-sm">{w.providerName}</div>
                        <span className="text-[11px] text-slate-400 font-mono">{w.accountNumber}</span>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          w.accountType === "AGENT" 
                            ? "bg-purple-50 text-purple-700 border border-purple-100" 
                            : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}>
                          {w.accountType}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-slate-500">
                        ৳{w.openingBalance.toLocaleString()}
                      </td>

                      {/* Stock-style Current Balance Editable Field */}
                      <td className="p-4 font-bold text-slate-900">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editBalance}
                            onChange={(e) => setEditBalance(Number(e.target.value))}
                            className="w-28 border border-emerald-500 p-1 rounded-lg text-xs font-bold text-emerald-700 focus:outline-none bg-emerald-50/30"
                          />
                        ) : (
                          <span className="text-emerald-600 font-bold text-sm">
                            ৳{w.currentBalance.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Cash In Commission Edit */}
                      <td className="p-4">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editCashInComm}
                            onChange={(e) => setEditCashInComm(Number(e.target.value))}
                            className="w-20 border border-slate-300 p-1 rounded-lg text-xs font-semibold"
                          />
                        ) : (
                          <span className="text-slate-700 font-semibold">৳{w.cashInCommission}</span>
                        )}
                      </td>

                      {/* Cash Out Commission Edit */}
                      <td className="p-4">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editCashOutComm}
                            onChange={(e) => setEditCashOutComm(Number(e.target.value))}
                            className="w-20 border border-slate-300 p-1 rounded-lg text-xs font-semibold"
                          />
                        ) : (
                          <span className="text-slate-700 font-semibold">৳{w.cashOutCommission}</span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        {isEditing ? (
                          <button
                            onClick={() => handleInlineUpdate(w.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors inline-flex items-center gap-1"
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

      {/* MODAL 1: MFS Categories Showcase */}
      {categoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                Default Agent Categories
              </h3>
              <button onClick={() => setCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              The following 5 agent transaction categories are active for your store:
            </p>

            <div className="space-y-2">
              {categories.map((c) => (
                <div key={c.id} className="flex justify-between items-center p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs font-semibold text-slate-800">
                  <span>{c.name}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-mono">{c.type}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setCategoryModalOpen(false)}
              className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Add New MFS Agent Wallet */}
      {walletModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                Add MFS Agent Wallet
              </h3>
              <button onClick={() => setWalletModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWallet} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">MFS Provider Name *</label>
                <select
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  <option value="Bkash">Bkash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                  <option value="CellFin">CellFin / Upay</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Wallet Phone Number *</label>
                <input
                  type="text"
                  placeholder="01700000000"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Account Type *</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as any)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  <option value="AGENT">AGENT (Default)</option>
                  <option value="MERCHANT">MERCHANT</option>
                  <option value="PERSONAL">PERSONAL</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Initial Opening Balance (BDT)</label>
                <input
                  type="number"
                  placeholder="0 (If no initial balance)"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Cash-In Comm. (/1k)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="4.12"
                    value={cashInCommission}
                    onChange={(e) => setCashInCommission(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Cash-Out Comm. (/1k)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="4.12"
                    value={cashOutCommission}
                    onChange={(e) => setCashOutCommission(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWalletModalOpen(false)}
                  className="w-1/2 border border-slate-200 py-2.5 rounded-xl font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all"
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