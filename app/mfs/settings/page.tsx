"use client";

import { useState } from "react";
import { Wallet, DollarSign, Save, ShieldCheck, Building2 } from "lucide-react";

export default function MFSWalletSettingsPage() {
  // ক্লায়েন্ট বা শপের নিজস্ব ওয়ালেট ও ক্যাশ ড্রয়ার স্টেট
  const [cashDrawer, setCashDrawer] = useState(15000); // ফিজিক্যাল ক্যাশ বক্স ব্যালেন্স
  const [wallets, setWallets] = useState([
    { id: "1", provider: "bKash Agent", number: "01700000000", balance: 50000 },
    { id: "2", provider: "Nagad Agent", number: "01800000000", balance: 35000 },
    { id: "3", provider: "Rocket Agent", number: "01900000000", balance: 20000 },
    { id: "4", provider: "Upay Agent", number: "01300000000", balance: 10000 },
  ]);

  // নতুন ওয়ালেট যোগ করার স্টেট
  const [newProvider, setNewProvider] = useState("bKash Agent");
  const [newNumber, setNewNumber] = useState("");
  const [newBalance, setNewBalance] = useState<number | "">("");

  // ওয়ালেট ব্যালেন্স পরিবর্তনের হ্যান্ডলার
  const handleBalanceChange = (id: string, value: string) => {
    const num = value === "" ? 0 : Number(value);
    setWallets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, balance: num } : w))
    );
  };

  // নতুন এজেন্ট ওয়ালেট যোগ করার ফাংশন
  const handleAddWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber || newNumber.length < 11) {
      alert("Please enter a valid agent number");
      return;
    }

    const newWalletObj = {
      id: Date.now().toString(),
      provider: newProvider,
      number: newNumber,
      balance: Number(newBalance) || 0,
    };

    setWallets([...wallets, newWalletObj]);
    setNewNumber("");
    setNewBalance("");
    alert("New Wallet Added Successfully!");
  };

  // সেভ করার ফাংশন (Backend API-তে পাঠানোর জন্য প্রস্তুত)
  // ডাটা সেভ করার আপডেট করা ফাংশন:
const handleSaveChanges = async () => {
  try {
    const res = await fetch("/api/mfs/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cashDrawer, wallets }),
    });

    const result = await res.json();
    if (result.success) {
      alert("Database Updated Successfully!");
    } else {
      alert("Failed to save data");
    }
  } catch (err) {
    console.error(err);
    alert("Server Connection Error");
  }
};

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-600" />
            Wallet & Cash Drawer Settings
          </h1>
          <p className="text-xs text-slate-500">Configure your initial or current MFS e-Money and Physical Cash</p>
        </div>
        <button
          onClick={handleSaveChanges}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* 1. In-Hand Cash Drawer Input */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Physical Cash Drawer (क্যাশ ড্রয়ার)</h3>
            <p className="text-xs text-slate-400">Total physical cash currently available in your shop drawer</p>
          </div>
        </div>

        <div className="max-w-md">
          <label className="text-xs font-semibold text-slate-600 mb-1 block">In-Hand Cash Amount (৳)</label>
          <input
            type="number"
            value={cashDrawer}
            onChange={(e) => setCashDrawer(Number(e.target.value))}
            className="w-full border border-slate-200 p-3 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* 2. Existing Agent Wallets Balance Editor */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">MFS Agent Wallets e-Money</h3>
            <p className="text-xs text-slate-400">Update current digital balance for each agent account</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wallets.map((w) => (
            <div key={w.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-slate-800">{w.provider}</span>
                <span className="text-xs font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-600">{w.number}</span>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">e-Money Balance (৳)</label>
                <input
                  type="number"
                  value={w.balance}
                  onChange={(e) => handleBalanceChange(w.id, e.target.value)}
                  className="w-full border border-slate-300 bg-white p-2.5 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Add New Agent Wallet Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Add New Agent Wallet</h3>
            <p className="text-xs text-slate-400">Connect a new MFS provider account</p>
          </div>
        </div>

        <form onSubmit={handleAddWallet} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Provider</label>
            <select
              value={newProvider}
              onChange={(e) => setNewProvider(e.target.value)}
              className="w-full border border-slate-200 p-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="bKash Agent">bKash Agent</option>
              <option value="Nagad Agent">Nagad Agent</option>
              <option value="Rocket Agent">Rocket Agent</option>
              <option value="Upay Agent">Upay Agent</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Agent Number</label>
            <input
              type="text"
              placeholder="017xxxxxxxx"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Initial e-Money (৳)</label>
            <input
              type="number"
              placeholder="10000"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              + Add Wallet to System
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}