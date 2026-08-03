"use client";

import { useState } from "react";
import { Smartphone, Zap, CheckCircle2, History } from "lucide-react";

export default function MobileRechargePage() {
  // রিচার্জ ওয়ালেট (ডিজিটাল ব্যালেন্স)
  const [rechargeBalance, setRechargeBalance] = useState(10000);
  const [inHandCash, setInHandCash] = useState(15000);
  const [todayRechargeProfit, setTodayRechargeProfit] = useState(0);

  // ইনপুট ফর্ম স্টেট
  const [operator, setOperator] = useState("GP");
  const [simType, setSimType] = useState<"PREPAID" | "POSTPAID" | "SKITTO">("PREPAID");
  const [mobileNumber, setMobileNumber] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [commissionRate, setCommissionRate] = useState<number>(27); // হাজারে ২৭ টাকা (২.৭%)

  // রিসেন্ট রিচার্জ হিস্ট্রি
  const [history, setHistory] = useState<any[]>([]);

  const handleRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (mobileNumber.length < 11) {
      alert("Please enter a valid 11-digit mobile number");
      return;
    }

    if (numAmount > rechargeBalance) {
      alert("Insufficient Recharge Balance!");
      return;
    }

    // কমিশন হিসাব (হাজারে কত টাকা লাভ)
    const profit = (numAmount / 1000) * commissionRate;

    // ১. রিচার্জ ওয়ালেট থেকে টাকা কমবে
    setRechargeBalance((prev) => prev - numAmount);

    // ২. কাস্টমার ক্যাশ দিল, তাই ক্যাশ ড্রয়ারে টাকা বাড়বে
    setInHandCash((prev) => prev + numAmount);

    // ৩. রিচার্জ প্রফিট যুক্ত হবে
    setTodayRechargeProfit((prev) => prev + profit);

    // ৪. হিস্ট্রি আপডেট
    const newTx = {
      id: Date.now().toString(),
      operator,
      mobileNumber,
      amount: numAmount,
      profit: profit.toFixed(2),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setHistory([newTx, ...history]);

    // ফর্ম রিসেট
    setAmount("");
    setMobileNumber("");
    alert(`Recharge Successful to ${operator} - ${mobileNumber}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-teal-600" />
            Mobile Recharge
          </h1>
          <p className="text-xs text-slate-500">Dedicated Flexiload / Mobile Recharge Management</p>
        </div>

        {/* Balance Counters */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
            <p className="text-[10px] uppercase font-semibold text-slate-500">Recharge e-Money</p>
            <p className="text-lg font-bold text-slate-900">৳{rechargeBalance.toLocaleString()}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
            <p className="text-[10px] uppercase font-semibold text-emerald-700">Cash Collected</p>
            <p className="text-lg font-bold text-emerald-800">৳{inHandCash.toLocaleString()}</p>
          </div>
          <div className="bg-teal-50 border border-teal-200 px-4 py-2 rounded-xl">
            <p className="text-[10px] uppercase font-semibold text-teal-700">Recharge Profit Today</p>
            <p className="text-lg font-bold text-teal-800">৳{todayRechargeProfit.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recharge Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
            <Zap className="w-5 h-5 text-teal-600" />
            Instant Recharge Form
          </h3>

          <form onSubmit={handleRecharge} className="space-y-5">
            {/* Operator Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-2 block">Select Operator</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {[
                  { name: "GP", color: "bg-blue-600", border: "border-blue-600" },
                  { name: "BL", color: "bg-orange-500", border: "border-orange-500" },
                  { name: "Robi", color: "bg-rose-600", border: "border-rose-600" },
                  { name: "Airtel", color: "bg-red-600", border: "border-red-600" },
                  { name: "Teletalk", color: "bg-emerald-600", border: "border-emerald-600" },
                ].map((op) => (
                  <button
                    type="button"
                    key={op.name}
                    onClick={() => setOperator(op.name)}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                      operator === op.name
                        ? `${op.border} bg-slate-900 text-white ring-2 ring-slate-900/20`
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${op.color}`}></span>
                    {op.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Connection Type */}
            <div className="flex gap-4">
              {(["PREPAID", "POSTPAID", "SKITTO"] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="simType"
                    checked={simType === type}
                    onChange={() => setSimType(type)}
                    className="accent-teal-600"
                  />
                  {type}
                </label>
              ))}
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Mobile Number</label>
                <input
                  type="text"
                  placeholder="017xxxxxxxx"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Amount (৳)</label>
                <input
                  type="number"
                  placeholder="20"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                />
              </div>
            </div>

            {/* Commission Settings */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Commission Rate (per ৳1,000):</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">৳</span>
                <input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-16 border border-slate-300 p-1 text-center rounded font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-sm flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              Send Recharge
            </button>
          </form>
        </div>

        {/* Right: Recent Recharge History */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <History className="w-4 h-4 text-slate-500" />
            Today's Recharge History
          </h3>

          {history.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No recharge performed yet today.
            </div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {history.map((tx) => (
                <div key={tx.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800">{tx.operator} - {tx.mobileNumber}</p>
                    <p className="text-[10px] text-slate-400">{tx.time} · Profit: +৳{tx.profit}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-teal-700 text-sm">৳{tx.amount}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}