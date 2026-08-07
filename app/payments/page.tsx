"use client";

import { useEffect, useState } from "react";
import { 
  CreditCard, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  Receipt, 
  Loader2, 
  X
} from "lucide-react";

interface CustomerPayment {
  id: string;
  amount: number;
  paymentMethod: string;
  createdAt: string;
  customer?: { name: string; phone: string };
}

interface SupplierPayment {
  id: string;
  amount: number;
  paymentMethod: string;
  createdAt: string;
  supplier?: { name: string; phone: string };
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  paymentMethod: string;
  createdAt: string;
  category?: { name: string };
}

export default function PaymentsPage() {
  const [data, setData] = useState<{
    customerPayments: CustomerPayment[];
    supplierPayments: SupplierPayment[];
    expenses: Expense[];
  }>({ customerPayments: [], supplierPayments: [], expenses: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"customer" | "supplier" | "expenses">("customer");

  // Expense Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [note, setNote] = useState("");

  // Helper Function for DD/MM/YYYY Date Formatting
  const formatDateDMY = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments");
      const resData = await res.json();
      if (resData.success && resData.data) {
        setData({
          customerPayments: resData.data.customerPayments || [],
          supplierPayments: resData.data.supplierPayments || [],
          expenses: resData.data.expenses || [],
        });
      }
    } catch (err) {
      console.error("Failed to load payments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          amount: Number(amount),
          paymentMethod,
          note,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setModalOpen(false);
        setTitle("");
        setAmount("");
        setNote("");
        fetchPayments();
      } else {
        alert(resData.error || "Failed to record expense");
      }
    } catch (err) {
      alert("Error adding expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCollected = data.customerPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalPaidSupplier = data.supplierPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalExpenses = data.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-emerald-600" />
            Payments & Expense Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track customer collections, supplier payments, and store operating expenses.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
            <ArrowDownLeft className="w-4 h-4" /> Customer Dues Collected
          </div>
          <p className="text-2xl font-black text-slate-900">৳ {totalCollected.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400">{data.customerPayments.length} Transactions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold">
            <ArrowUpRight className="w-4 h-4" /> Paid to Suppliers
          </div>
          <p className="text-2xl font-black text-slate-900">৳ {totalPaidSupplier.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400">{data.supplierPayments.length} Transactions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold">
            <Receipt className="w-4 h-4" /> Operating Expenses
          </div>
          <p className="text-2xl font-black text-slate-900">৳ {totalExpenses.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400">{data.expenses.length} Records</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold text-slate-500">
        <button
          onClick={() => setActiveTab("customer")}
          className={`pb-3 transition-all cursor-pointer ${
            activeTab === "customer" ? "border-b-2 border-emerald-600 text-emerald-600" : "hover:text-slate-800"
          }`}
        >
          Customer Collections ({data.customerPayments.length})
        </button>
        <button
          onClick={() => setActiveTab("supplier")}
          className={`pb-3 transition-all cursor-pointer ${
            activeTab === "supplier" ? "border-b-2 border-emerald-600 text-emerald-600" : "hover:text-slate-800"
          }`}
        >
          Supplier Payments ({data.supplierPayments.length})
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`pb-3 transition-all cursor-pointer ${
            activeTab === "expenses" ? "border-b-2 border-emerald-600 text-emerald-600" : "hover:text-slate-800"
          }`}
        >
          Shop Expenses ({data.expenses.length})
        </button>
      </div>

      {/* Tables */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            Loading payments...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Date / Time</th>
                  <th className="p-4">Entity / Purpose</th>
                  <th className="p-4">Method</th>
                  <th className="p-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {/* 🎯 CUSTOMER PAYMENTS TABLE */}
                {activeTab === "customer" &&
                  (data.customerPayments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        No customer collection records found.
                      </td>
                    </tr>
                  ) : (
                    data.customerPayments.map((cp) => (
                      <tr key={cp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-500 font-medium">
                          {formatDateDMY(cp.createdAt)}
                        </td>
                        <td className="p-4 font-bold text-slate-900">
                          {cp.customer?.name || "General Customer"}{" "}
                          <span className="text-slate-400 font-normal block text-[10px]">
                            {cp.customer?.phone || ""}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                            {cp.paymentMethod}
                          </span>
                        </td>
                        <td className="p-4 text-right font-black text-emerald-600">
                          + ৳{Number(cp.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ))}

                {/* 🎯 SUPPLIER PAYMENTS TABLE */}
                {activeTab === "supplier" &&
                  (data.supplierPayments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        No supplier payment records found.
                      </td>
                    </tr>
                  ) : (
                    data.supplierPayments.map((sp) => (
                      <tr key={sp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-500 font-medium">
                          {formatDateDMY(sp.createdAt)}
                        </td>
                        <td className="p-4 font-bold text-slate-900">
                          {sp.supplier?.name || "General Supplier"}{" "}
                          <span className="text-slate-400 font-normal block text-[10px]">
                            {sp.supplier?.phone || ""}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                            {sp.paymentMethod}
                          </span>
                        </td>
                        <td className="p-4 text-right font-black text-blue-600">
                          - ৳{Number(sp.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ))}

                {/* 🎯 EXPENSES TABLE */}
                {activeTab === "expenses" &&
                  (data.expenses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        No expense records found.
                      </td>
                    </tr>
                  ) : (
                    data.expenses.map((ex) => (
                      <tr key={ex.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-500 font-medium">
                          {formatDateDMY(ex.createdAt)}
                        </td>
                        <td className="p-4 font-bold text-slate-900">{ex.title}</td>
                        <td className="p-4">
                          <span className="bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                            {ex.paymentMethod}
                          </span>
                        </td>
                        <td className="p-4 text-right font-black text-rose-600">
                          - ৳{Number(ex.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE EXPENSE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                Record Store Expense
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Expense Title / Reason *</label>
                <input
                  type="text"
                  placeholder="e.g. Shop Rent, Electricity Bill, Tea Snacks"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Amount Paid (BDT) *</label>
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

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="CASH">CASH</option>
                  <option value="BKASH">BKASH / NAGAD</option>
                  <option value="BANK">BANK TRANSFER</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Note / Details</label>
                <input
                  type="text"
                  placeholder="Optional details..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  {isSubmitting ? "Recording..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}