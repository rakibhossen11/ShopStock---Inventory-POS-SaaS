"use client";

import { useState } from "react";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Smartphone, 
  Receipt, 
  ArrowLeftRight, 
  Plus, 
  TrendingUp, 
  CircleDollarSign 
} from "lucide-react";

export default function MFSAgentPage() {
  // ১. এজেন্ট ওয়ালেটগুলোর প্রাথমিক ব্যালেন্স
  const [wallets, setWallets] = useState([
    { id: "1", provider: "bKash Agent", number: "01700000000", balance: 50000, color: "bg-pink-600" },
    { id: "2", provider: "Nagad Agent", number: "01800000000", balance: 35000, color: "bg-orange-600" },
    { id: "3", provider: "Rocket Agent", number: "01900000000", balance: 20000, color: "bg-purple-600" },
  ]);

  // ২. ক্যাশ বক্স এবং প্রফিটের স্টেট
  const [inHandCash, setInHandCash] = useState(15000); // ফিজিক্যাল ক্যাশ
  const [todayProfit, setTodayProfit] = useState(0);    // আজকের মোট নিট কমিশন/প্রফিট

  // ৩. ইনপুট ফর্মের স্টেট
  const [selectedWallet, setSelectedWallet] = useState("1");
  const [txType, setTxType] = useState<"CASH_IN" | "CASH_OUT" | "B2B_RECEIVE" | "B2B_SEND" | "PAY_BILL" | "RECHARGE">("CASH_IN");
  const [amount, setAmount] = useState<number | "">("");
  const [commissionRate, setCommissionRate] = useState<number | "">(4.1); // যেমন: হাজারে ৪.১০ টাকা
  const [customerNo, setCustomerNo] = useState("");

  // ৪. ট্রানজেকশন প্রসেস করার ফাংশন
  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    const numCommRate = Number(commissionRate) || 0;

    if (!numAmount || numAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    // কমিশন হিসাব (হাজারে কত টাকা)
    const calculatedCommission = (numAmount / 1000) * numCommRate;

    setWallets((prevWallets) =>
      prevWallets.map((w) => {
        if (w.id === selectedWallet) {
          let newBalance = w.balance;

          if (txType === "CASH_IN" || txType === "B2B_SEND" || txType === "PAY_BILL" || txType === "RECHARGE") {
            newBalance -= numAmount; // e-Money কমবে
          } else if (txType === "CASH_OUT" || txType === "B2B_RECEIVE") {
            newBalance += numAmount; // e-Money বাড়বে
          }

          return { ...w, balance: newBalance };
        }
        return w;
      })
    );

    // ক্যাশ বক্স (Physical Cash) আপডেট করার লজিক
    if (txType === "CASH_IN" || txType === "B2B_SEND" || txType === "PAY_BILL" || txType === "RECHARGE") {
      setInHandCash((prev) => prev + numAmount); // ক্যাশ বাড়বে
    } else if (txType === "CASH_OUT" || txType === "B2B_RECEIVE") {
      setInHandCash((prev) => prev - numAmount); // ক্যাশ কমবে
    }

    // প্রফিট/কমিশন যোগ করা (B2B ট্রানজেকশনে লাভ নেই)
    if (txType !== "B2B_RECEIVE" && txType !== "B2B_SEND") {
      setTodayProfit((prev) => prev + calculatedCommission);
    }

    // ফর্ম রিসেট
    setAmount("");
    setCustomerNo("");
    alert("Transaction Successful!");
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">MFS Agent Management</h1>
          <p className="text-xs text-slate-500">Track e-Money, Physical Cash, and Pure Profit</p>
        </div>

        {/* Cash Box & Pure Profit Counter */}
        <div className="flex items-center gap-4">
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
            <p className="text-[10px] uppercase font-semibold text-emerald-700">In-Hand Cash Drawer</p>
            <p className="text-lg font-bold text-emerald-800">৳{inHandCash.toLocaleString()}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
            <p className="text-[10px] uppercase font-semibold text-amber-700">Today's Pure Profit</p>
            <p className="text-lg font-bold text-amber-800">৳{todayProfit.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Agent Wallets Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {wallets.map((w) => (
          <div key={w.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${w.color} text-white rounded-xl flex items-center justify-center font-bold text-lg`}>
                  {w.provider[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{w.provider}</h3>
                  <p className="text-xs text-slate-400">{w.number}</p>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 font-medium uppercase">e-Money Balance</p>
              <p className="text-xl font-bold text-slate-900">৳{w.balance.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Unified Transaction Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <CircleDollarSign className="w-5 h-5 text-emerald-600" />
          New Agent Transaction
        </h3>

        <form onSubmit={handleTransaction} className="space-y-5">
          {/* Transaction Type Buttons */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 block">Select Transaction Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { type: "CASH_IN", label: "Cash In", icon: ArrowUpRight, color: "text-emerald-600" },
                { type: "CASH_OUT", label: "Cash Out", icon: ArrowDownLeft, color: "text-rose-600" },
                { type: "B2B_RECEIVE", label: "B2B Receive", icon: ArrowLeftRight, color: "text-blue-600" },
                { type: "B2B_SEND", label: "B2B Send", icon: ArrowLeftRight, color: "text-purple-600" },
                { type: "PAY_BILL", label: "Pay Bill", icon: Receipt, color: "text-amber-600" },
                { type: "RECHARGE", label: "Recharge", icon: Smartphone, color: "text-teal-600" },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = txType === item.type;
                return (
                  <button
                    type="button"
                    key={item.type}
                    onClick={() => setTxType(item.type as any)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${item.color}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Wallet Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Select Agent Wallet</label>
              <select
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
                className="w-full border border-slate-200 p-2.5 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.provider} ({w.number})
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Number / Reference */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                {txType.startsWith("B2B") ? "Distributor/Agent No" : "Customer / Bill No"}
              </label>
              <input
                type="text"
                placeholder="017xxxxxxxx"
                value={customerNo}
                onChange={(e) => setCustomerNo(e.target.value)}
                className="w-full border border-slate-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Amount (৳)</label>
              <input
                type="number"
                placeholder="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full border border-slate-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Commission Rate (Per 1000 Tk) */}
          {txType !== "B2B_RECEIVE" && txType !== "B2B_SEND" && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Commission Rate (Per ৳1,000):</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">৳</span>
                <input
                  type="number"
                  step="0.1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-20 border border-slate-300 p-1 text-center rounded text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-sm"
          >
            Submit Transaction
          </button>
        </form>
      </div>
    </div>
  );
}