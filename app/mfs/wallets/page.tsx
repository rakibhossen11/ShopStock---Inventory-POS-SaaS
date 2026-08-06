"use client";

import { useEffect, useState } from "react";
import { 
  Smartphone, 
  Wallet, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  Building2, 
  Phone, 
  DollarSign,
  Percent,
  Edit2,
  Trash2,
  ShieldCheck
} from "lucide-react";

interface AgentWallet {
  id: string;
  providerName: string;
  accountNumber: string;
  currentBalance: number;
  commissionType: "FLAT_PER_THOUSAND" | "PERCENTAGE";
  cashInCommission: number;
  cashOutCommission: number;
}

interface PersonalWallet {
  id: string;
  providerName: string;
  accountNumber: string;
  currentBalance: number;
}

export default function UnifiedWalletsPage() {
  const [activeTab, setActiveTab] = useState<"AGENT" | "PERSONAL">("AGENT");
  
  // Data States
  const [agentWallets, setAgentWallets] = useState<AgentWallet[]>([]);
  const [personalWallets, setPersonalWallets] = useState<PersonalWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Agent Form States
  const [agentProvider, setAgentProvider] = useState("Bkash");
  const [agentPhone, setAgentPhone] = useState("");
  const [agentOpeningBal, setAgentOpeningBal] = useState<number | "">("");
  const [commissionType, setCommissionType] = useState<"FLAT_PER_THOUSAND" | "PERCENTAGE">("FLAT_PER_THOUSAND");
  const [cashInComm, setCashInComm] = useState<number | "">(4.12);
  const [cashOutComm, setCashOutComm] = useState<number | "">(4.12);

  // Personal Form States
  const [personalProvider, setPersonalProvider] = useState("Bkash");
  const [personalPhone, setPersonalPhone] = useState("");
  const [personalOpeningBal, setPersonalOpeningBal] = useState<number | "">("");

  // Fetch All Wallets
  const fetchWallets = async () => {
    setLoading(true);
    try {
      const [agentRes, personalRes] = await Promise.all([
        fetch("/api/mfs/agent"),
        fetch("/api/mfs/personal")
      ]);

      const agentData = await agentRes.json();
      const personalData = await personalRes.json();

      if (agentData.success) {
        setAgentWallets(agentData.data.wallets || agentData.data || []);
      }
      if (personalData.success) {
        setPersonalWallets(personalData.data || []);
      }
    } catch (err) {
      console.error("Failed to load wallets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  // Submit Agent Wallet Form
  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentPhone) {
      alert("Account number is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/mfs/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerName: agentProvider,
          accountNumber: agentPhone,
          openingBalance: Number(agentOpeningBal) || 0,
          commissionType,
          cashInCommission: Number(cashInComm) || 0,
          cashOutCommission: Number(cashOutComm) || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Agent Wallet added successfully!");
        setAgentPhone("");
        setAgentOpeningBal("");
        fetchWallets();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        alert(data.error || "Failed to add Agent Wallet");
      }
    } catch (err) {
      alert("Error submitting Agent Wallet");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Personal Wallet Form
  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalPhone) {
      alert("Account number is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/mfs/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerName: personalProvider,
          accountNumber: personalPhone,
          openingBalance: Number(personalOpeningBal) || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Personal Wallet added successfully!");
        setPersonalPhone("");
        setPersonalOpeningBal("");
        fetchWallets();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        alert(data.error || "Failed to add Personal Wallet");
      }
    } catch (err) {
      alert("Error submitting Personal Wallet");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
          Loading MFS Wallets...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-6 space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-emerald-600" />
            MFS Wallet Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage both Agent and Personal MFS accounts in a single workspace.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab("AGENT")}
            className={`px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "AGENT"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Agent Wallets ({agentWallets.length})
          </button>
          <button
            onClick={() => setActiveTab("PERSONAL")}
            className={`px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "PERSONAL"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Wallet className="w-4 h-4" />
            Personal Wallets ({personalWallets.length})
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Dynamic Add Wallet Form */}
        <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" />
            Add New {activeTab === "AGENT" ? "Agent" : "Personal"} Wallet
          </h3>

          {activeTab === "AGENT" ? (
            /* AGENT WALLET FORM */
            <form onSubmit={handleAgentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Provider *</label>
                <select
                  value={agentProvider}
                  onChange={(e) => setAgentProvider(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Bkash">Bkash Agent</option>
                  <option value="Nagad">Nagad Agent</option>
                  <option value="Rocket">Rocket Agent</option>
                  <option value="CellFin">CellFin / IBBL</option>
                  <option value="Upay">Upay Agent</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Account / SIM Phone Number *</label>
                <input
                  type="text"
                  placeholder="01700000000"
                  value={agentPhone}
                  onChange={(e) => setAgentPhone(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Opening Balance (BDT)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={agentOpeningBal}
                  onChange={(e) => setAgentOpeningBal(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Commission Type</label>
                <select
                  value={commissionType}
                  onChange={(e) => setCommissionType(e.target.value as any)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold bg-white focus:outline-none"
                >
                  <option value="FLAT_PER_THOUSAND">Flat Per Thousand (e.g. 4.12 Tk/1000)</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cash In Comm.</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cashInComm}
                    onChange={(e) => setCashInComm(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full border border-slate-200 p-2 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cash Out Comm.</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cashOutComm}
                    onChange={(e) => setCashOutComm(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full border border-slate-200 p-2 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs shadow-sm mt-2"
              >
                {submitting ? "Saving..." : "Save Agent Wallet"}
              </button>
            </form>
          ) : (
            /* PERSONAL WALLET FORM */
            <form onSubmit={handlePersonalSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Provider *</label>
                <select
                  value={personalProvider}
                  onChange={(e) => setPersonalProvider(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Bkash">Bkash Personal</option>
                  <option value="Nagad">Nagad Personal</option>
                  <option value="Rocket">Rocket Personal</option>
                  <option value="CellFin">CellFin / IBBL</option>
                  <option value="Upay">Upay Personal</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Account Phone Number *</label>
                <input
                  type="text"
                  placeholder="01700000000"
                  value={personalPhone}
                  onChange={(e) => setPersonalPhone(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Opening E-Money Balance (BDT)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={personalOpeningBal}
                  onChange={(e) => setPersonalOpeningBal(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs shadow-sm mt-2"
              >
                {submitting ? "Saving..." : "Save Personal Wallet"}
              </button>
            </form>
          )}
        </div>

        {/* Right Side: Wallets Cards & List */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
            <span>{activeTab === "AGENT" ? "Agent Wallets List" : "Personal Wallets List"}</span>
            <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200">
              Total Balance: ৳
              {activeTab === "AGENT"
                ? agentWallets.reduce((acc, w) => acc + w.currentBalance, 0).toLocaleString()
                : personalWallets.reduce((acc, w) => acc + w.currentBalance, 0).toLocaleString()}
            </span>
          </div>

          {activeTab === "AGENT" ? (
            /* AGENT WALLETS CARDS */
            agentWallets.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                No Agent Wallets added yet. Use the form to add one.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {agentWallets.map((wallet) => (
                  <div key={wallet.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{wallet.providerName} Agent</span>
                        <span className="text-slate-500 font-mono text-xs">{wallet.accountNumber}</span>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-100">
                        AGENT
                      </span>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <span className="text-[11px] text-slate-400 block font-medium">Current Balance</span>
                      <p className="text-xl font-black text-slate-900">৳{wallet.currentBalance.toLocaleString()}</p>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl text-[11px] text-slate-600 flex justify-between font-semibold">
                      <span>Cash In: ৳{wallet.cashInCommission}/1k</span>
                      <span>Cash Out: ৳{wallet.cashOutCommission}/1k</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* PERSONAL WALLETS CARDS */
            personalWallets.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                No Personal Wallets added yet. Use the form to add one.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {personalWallets.map((wallet) => (
                  <div key={wallet.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{wallet.providerName} Personal</span>
                        <span className="text-slate-500 font-mono text-xs">{wallet.accountNumber}</span>
                      </div>
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-100">
                        PERSONAL
                      </span>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <span className="text-[11px] text-slate-400 block font-medium">Current Balance</span>
                      <p className="text-xl font-black text-slate-900">৳{wallet.currentBalance.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}