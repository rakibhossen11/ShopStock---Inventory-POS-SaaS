"use client";

import { useEffect, useState } from "react";
import { 
  Smartphone, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCw, 
  CheckCircle2, 
  Wallet, 
  DollarSign, 
  Send,
  Phone,
  PlusCircle,
  MinusCircle,
  TrendingUp,
  CreditCard
} from "lucide-react";

interface MFSAgentWallet {
  id: string;
  providerName: string;
  accountNumber: string;
  currentBalance: number;
  commissionType: string;
  cashInCommission: number;
  cashOutCommission: number;
}

interface MFSPersonalWallet {
  id: string;
  providerName: string;
  accountNumber: string;
  currentBalance: number;
}

export default function MFSSellPage() {
  const [agentWallets, setAgentWallets] = useState<MFSAgentWallet[]>([]);
  const [personalWallets, setPersonalWallets] = useState<MFSPersonalWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Category & Tab Selection
  const [walletCategory, setWalletCategory] = useState<"AGENT" | "PERSONAL">("AGENT");
  const [transactionType, setTransactionType] = useState<"CASH_IN" | "CASH_OUT" | "PERSONAL_RECEIVED" | "PERSONAL_SEND">("CASH_IN");

  // Form States
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [extraAmount, setExtraAmount] = useState<number | "">(""); // বাড়তি টাকা/লাভ
  const [costAmount, setCostAmount] = useState<number | "">("");   // খরচ/ফি
  const [customerPhone, setCustomerPhone] = useState("");
  const [referenceTrxId, setReferenceTrxId] = useState("");

  const fetchData = async () => {
    try {
      const [agentRes, personalRes] = await Promise.all([
        fetch("/api/mfs/agent"),
        fetch("/api/mfs/personal")
      ]);

      const agentData = await agentRes.json();
      const personalData = await personalRes.json();

      if (agentData.success) {
        setAgentWallets(agentData.data.wallets);
        if (agentData.data.wallets.length > 0 && walletCategory === "AGENT") {
          setSelectedWalletId(agentData.data.wallets[0].id);
        }
      }

      if (personalData.success) {
        setPersonalWallets(personalData.data);
      }
    } catch (err) {
      console.error("Failed to load wallets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ওয়ালেট ক্যাটাগরি চেঞ্জ হলে আইডি রিসেট করা
  const handleCategoryChange = (cat: "AGENT" | "PERSONAL") => {
    setWalletCategory(cat);
    if (cat === "AGENT") {
      setTransactionType("CASH_IN");
      if (agentWallets.length > 0) setSelectedWalletId(agentWallets[0].id);
    } else {
      setTransactionType("PERSONAL_RECEIVED");
      if (personalWallets.length > 0) setSelectedWalletId(personalWallets[0].id);
    }
  };

  const selectedAgentWallet = agentWallets.find((w) => w.id === selectedWalletId);
  const selectedPersonalWallet = personalWallets.find((w) => w.id === selectedWalletId);

  // লাইভ এজেন্ট কমিশন গণনা
  const calculateAgentCommission = () => {
    if (!selectedAgentWallet || !amount || Number(amount) <= 0) return 0;
    const numAmount = Number(amount);
    const rate = transactionType === "CASH_IN" ? selectedAgentWallet.cashInCommission : selectedAgentWallet.cashOutCommission;

    if (selectedAgentWallet.commissionType === "PERCENTAGE") {
      return (numAmount * rate) / 100;
    }
    return (numAmount / 1000) * rate;
  };

  const estimatedCommission = calculateAgentCommission();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWalletId || !amount || Number(amount) <= 0) {
      alert("Please select a wallet and enter a valid amount.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/mfs/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletCategory,
          agentWalletId: walletCategory === "AGENT" ? selectedWalletId : undefined,
          personalWalletId: walletCategory === "PERSONAL" ? selectedWalletId : undefined,
          transactionType,
          amount: Number(amount),
          extraAmount: Number(extraAmount) || 0,
          costAmount: Number(costAmount) || 0,
          customerPhone,
          referenceTrxId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setAmount("");
        setExtraAmount("");
        setCostAmount("");
        setCustomerPhone("");
        setReferenceTrxId("");
        fetchData(); // ওয়ালেটের নতুন ব্যালেন্স রিলোড
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        alert(data.error || "Transaction failed");
      }
    } catch (err) {
      alert("Error submitting transaction");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
          Loading MFS Terminal...
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
            <Smartphone className="w-7 h-7 text-emerald-600" />
            MFS All-in-One Terminal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Seamlessly handle Agent (Cash In/Out) and Personal (Received/Send) operations in one screen.
          </p>
        </div>

        {/* Category Selector (Agent vs Personal) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => handleCategoryChange("AGENT")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              walletCategory === "AGENT" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Agent Wallets
          </button>
          <button
            type="button"
            onClick={() => handleCategoryChange("PERSONAL")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              walletCategory === "PERSONAL" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Personal Wallets
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Dynamic Transaction Form */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          
          {/* Action Tabs Based on Category */}
          {walletCategory === "AGENT" ? (
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl">
              <button
                type="button"
                onClick={() => setTransactionType("CASH_IN")}
                className={`py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  transactionType === "CASH_IN" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" /> Cash In (ক্যাশ ইন)
              </button>
              <button
                type="button"
                onClick={() => setTransactionType("CASH_OUT")}
                className={`py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  transactionType === "CASH_OUT" ? "bg-rose-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ArrowUpRight className="w-4 h-4" /> Cash Out (ক্যাশ আউট)
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl">
              <button
                type="button"
                onClick={() => setTransactionType("PERSONAL_RECEIVED")}
                className={`py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  transactionType === "PERSONAL_RECEIVED" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <PlusCircle className="w-4 h-4" /> Receive E-Money (রিসিভ/কেনা)
              </button>
              <button
                type="button"
                onClick={() => setTransactionType("PERSONAL_SEND")}
                className={`py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  transactionType === "PERSONAL_SEND" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <MinusCircle className="w-4 h-4" /> Send E-Money (পাঠানো/বিক্রি)
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Wallet Dropdown */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Select {walletCategory === "AGENT" ? "Agent" : "Personal"} Wallet *
              </label>
              <select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className="w-full border border-slate-200 p-3 rounded-xl text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {walletCategory === "AGENT"
                  ? agentWallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.providerName} ({w.accountNumber}) — Bal: ৳{w.currentBalance.toLocaleString()}
                      </option>
                    ))
                  : personalWallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.providerName} ({w.accountNumber}) — Bal: ৳{w.currentBalance.toLocaleString()}
                      </option>
                    ))}
              </select>
            </div>

            {/* Amount and Special Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Base Amount (BDT) *</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full border border-slate-200 p-3 pl-9 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Personal Received extra field */}
              {transactionType === "PERSONAL_RECEIVED" && (
                <div>
                  <label className="font-bold text-emerald-700 block mb-1">Extra E-Money Received / Profit (বাড়তি টাকা) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="e.g. 150"
                      value={extraAmount}
                      onChange={(e) => setExtraAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full border border-emerald-300 bg-emerald-50/50 p-3 pl-9 rounded-xl text-sm font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <TrendingUp className="w-4 h-4 text-emerald-600 absolute left-3 top-3.5" />
                  </div>
                </div>
              )}

              {/* Personal Send cost field */}
              {transactionType === "PERSONAL_SEND" && (
                <div>
                  <label className="font-bold text-rose-700 block mb-1">Service Fee / Charge Cost (খরচ) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="e.g. 10"
                      value={costAmount}
                      onChange={(e) => setCostAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full border border-rose-300 bg-rose-50/50 p-3 pl-9 rounded-xl text-sm font-bold text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <CreditCard className="w-4 h-4 text-rose-600 absolute left-3 top-3.5" />
                  </div>
                </div>
              )}

              {/* Phone Field for Agent transactions */}
              {walletCategory === "AGENT" && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Phone Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="01700000000"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full border border-slate-200 p-3 pl-9 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>
              )}
            </div>

            {/* Reference TrxID */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Reference / TrxID (Optional)</label>
              <input
                type="text"
                placeholder="e.g. TRX12345678"
                value={referenceTrxId}
                onChange={(e) => setReferenceTrxId(e.target.value)}
                className="w-full border border-slate-200 p-3 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm ${
                walletCategory === "AGENT"
                  ? transactionType === "CASH_IN" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  : transactionType === "PERSONAL_RECEIVED" ? "bg-blue-600 hover:bg-blue-700" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {submitting ? (
                "Processing Transaction..."
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    Submit {walletCategory === "AGENT" ? transactionType : transactionType === "PERSONAL_RECEIVED" ? "E-Money Receive" : "E-Money Send"}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Calculation & Drawer Status */}
        <div className="space-y-4">
          {/* Wallet Info Card */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-[10px] uppercase font-bold text-slate-400">Active Wallet</span>
              <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-emerald-400 font-bold">
                {walletCategory === "AGENT" ? selectedAgentWallet?.providerName : selectedPersonalWallet?.providerName}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block">Current Balance</span>
              <p className="text-2xl font-black text-white mt-1">
                ৳{walletCategory === "AGENT" 
                  ? selectedAgentWallet?.currentBalance.toLocaleString() 
                  : selectedPersonalWallet?.currentBalance.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Breakdown Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Transaction Impact
            </h3>

            {walletCategory === "AGENT" ? (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Commission:</span>
                  <span className="font-bold text-emerald-600">+৳{estimatedCommission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-2">
                  <span>Cash Drawer:</span>
                  <span className={transactionType === "CASH_IN" ? "text-emerald-600" : "text-rose-600"}>
                    {transactionType === "CASH_IN" ? "+" : "-"}৳{Number(amount) || 0}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Cash Drawer:</span>
                  <span className={transactionType === "PERSONAL_RECEIVED" ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>
                    {transactionType === "PERSONAL_RECEIVED" ? "-" : "+"}৳{Number(amount) || 0}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 border-t border-slate-100 pt-2 font-bold">
                  <span>Wallet E-Money Impact:</span>
                  <span className="text-blue-600">
                    {transactionType === "PERSONAL_RECEIVED"
                      ? `+৳${(Number(amount) || 0) + (Number(extraAmount) || 0)}`
                      : `-৳${(Number(amount) || 0) + (Number(costAmount) || 0)}`}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}