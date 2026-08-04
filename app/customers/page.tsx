"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Trash2, 
  Loader2, 
  X, 
  DollarSign
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  dueBalance: number;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Create Modal
  const [createModal, setCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [openingDue, setOpeningDue] = useState<number | "">(0);

  // Collect Payment Modal
  const [payModal, setPayModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payRef, setPayRef] = useState("");
  const [payNote, setPayNote] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (data.success) setCustomers(data.data);
    } catch (err) {
      console.error("Failed to load customers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // ১. নতুন কাস্টমার এন্ট্রি
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          address,
          openingDue: Number(openingDue) || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCreateModal(false);
        setName("");
        setPhone("");
        setEmail("");
        setAddress("");
        setOpeningDue(0);
        fetchCustomers();
      } else {
        alert(data.error || "Failed to add customer");
      }
    } catch (err) {
      alert("Error adding customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ২. বাকী টাকা গ্রহণ সাবমিট
  const handleCollectDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !payAmount || Number(payAmount) <= 0) return;

    setIsPaying(true);
    try {
      const res = await fetch("/api/customers/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          amount: Number(payAmount),
          paymentMethod: payMethod,
          referenceNo: payRef,
          note: payNote,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPayModal(false);
        setSelectedCustomer(null);
        setPayAmount("");
        setPayRef("");
        setPayNote("");
        fetchCustomers();
      } else {
        alert(data.error || "Failed to record payment");
      }
    } catch (err) {
      alert("Error processing payment");
    } finally {
      setIsPaying(false);
    }
  };

  // ৩. ডিলিট করা
  const handleDelete = async (id: string, custName: string) => {
    if (!confirm(`Are you sure you want to delete ${custName}?`)) return;

    try {
      const res = await fetch(`/api/customers?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchCustomers();
      } else {
        alert(data.error || "Could not delete customer");
      }
    } catch (err) {
      alert("Error deleting customer");
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const totalDueReceivable = customers.reduce((sum, c) => sum + (c.dueBalance > 0 ? c.dueBalance : 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-600" />
            Customer Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage store clients, track due balances, and receive debt collections.
          </p>
        </div>

        <button
          onClick={() => setCreateModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Due Summary Bar */}
      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex justify-between items-center">
        <div>
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">Total Customer Dues Receivable</span>
          <p className="text-2xl font-black text-emerald-700 mt-0.5">৳ {totalDueReceivable.toLocaleString()}</p>
        </div>
        <div className="text-xs text-emerald-700 font-medium">
          Total Registered: <span className="font-bold">{customers.length} Clients</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search customer by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No customers found. Click "Add New Customer" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Phone / Email</th>
                  <th className="p-4">Address</th>
                  <th className="p-4">Current Due</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900 text-sm">
                      {c.name}
                    </td>

                    <td className="p-4 space-y-0.5 text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {c.phone}
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Mail className="w-3.5 h-3.5" /> {c.email}
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-slate-500">
                      {c.address ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{c.address}</span>
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </td>

                    <td className="p-4 font-bold">
                      {c.dueBalance > 0 ? (
                        <span className="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 inline-block">
                          Due: ৳ {c.dueBalance.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block">
                          Clear (৳ 0)
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right space-x-2">
                      {c.dueBalance > 0 && (
                        <button
                          onClick={() => {
                            setSelectedCustomer(c);
                            setPayModal(true);
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Collect Due
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Add New Customer */}
      {createModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                Add New Customer
              </h3>
              <button onClick={() => setCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Customer Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahim Uddin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mobile Phone Number *</label>
                <input
                  type="text"
                  placeholder="01700000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="rahim@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Address</label>
                <input
                  type="text"
                  placeholder="e.g. Dhanmondi, Dhaka"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Previous Due Balance (BDT)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={openingDue}
                  onChange={(e) => setOpeningDue(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-rose-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="w-1/2 border border-slate-200 py-2.5 rounded-xl font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all"
                >
                  {isSubmitting ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Collect Due Payment */}
      {payModal && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Collect Customer Due
              </h3>
              <button onClick={() => setPayModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs">
              <p className="font-bold text-slate-800">{selectedCustomer.name}</p>
              <p className="text-slate-500">
                Current Due Amount:{" "}
                <span className="font-bold text-rose-600">
                  ৳ {selectedCustomer.dueBalance.toLocaleString()}
                </span>
              </p>
            </div>

            <form onSubmit={handleCollectDue} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Amount Collected (BDT) *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedCustomer.dueBalance}
                  placeholder="Enter collected amount"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="CASH">CASH</option>
                  <option value="BKASH">BKASH / NAGAD</option>
                  <option value="BANK">BANK TRANSFER</option>
                  <option value="CARD">CARD</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reference / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Bkash TrxID or note"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModal(false)}
                  className="w-1/2 border border-slate-200 py-2.5 rounded-xl font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPaying}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all"
                >
                  {isPaying ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}