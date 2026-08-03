"use client";

import { useEffect, useState } from "react";
import { 
  Store, 
  MapPin, 
  Phone, 
  Coins, 
  Save, 
  Building,
  RefreshCw,
  CheckCircle2
} from "lucide-react";

export default function StoreSetupPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");

  // Store Information States
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("BDT");

  // ১. পেজ লোড হওয়ার পর সার্ভার থেকে ডাটা ফেচ করা
  useEffect(() => {
    async function loadStoreData() {
      try {
        const res = await fetch("/api/store/setup");
        const result = await res.json();

        if (result.success && result.data) {
          setName(result.data.name || "");
          setAddress(result.data.address || "");
          setPhone(result.data.phone || "");
          setCurrency(result.data.currency || "BDT");
        }
      } catch (error) {
        console.error("Failed to load store data:", error);
      } finally {
        setFetching(false);
      }
    }

    loadStoreData();
  }, []);

  // ২. ডাটা সেভ বা আপডেট করা
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter a Store Name");
      return;
    }

    setLoading(true);
    setSuccessMsg("");

    try {
      const payload = {
        name,
        address,
        phone,
        currency,
      };

      const res = await fetch("/api/store/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMsg("Store profile updated successfully!");
        setTimeout(() => setSuccessMsg(""), 3000); // ৩ সেকেন্ড পর মেসেজ চলে যাবে
      } else {
        alert("Failed to update store details.");
      }
    } catch (err) {
      console.error("Setup Error:", err);
      alert("Server Connection Error!");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
          Loading Store Information...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto my-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      
      {/* Page Header */}
      <div className="text-center space-y-2 border-b border-slate-100 pb-5">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
          <Building className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Store Profile</h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          View and update your shop's basic details and base currency.
        </p>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Store Name */}
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">Store / Shop Name *</label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Dhaka Super Store"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 p-2.5 pl-9 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
              required
            />
            <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">Contact Phone Number</label>
          <div className="relative">
            <input
              type="text"
              placeholder="017xxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-slate-200 p-2.5 pl-9 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
            />
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">Store Address / Location</label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Dhanmondi, Dhaka"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-slate-200 p-2.5 pl-9 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
            />
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Base Currency */}
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">Base Currency</label>
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full border border-slate-200 p-2.5 pl-9 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
            >
              <option value="BDT">BDT (৳ - Bangladeshi Taka)</option>
              <option value="SAR">SAR (Saudi Riyal)</option>
              <option value="USD">USD ($ - US Dollar)</option>
            </select>
            <Coins className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Save Changes Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm text-sm mt-3"
        >
          {loading ? (
            "Saving Changes..."
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Update Store Profile</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}