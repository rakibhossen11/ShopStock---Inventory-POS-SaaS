"use client";

import { useEffect, useState } from "react";
import { 
  Boxes, 
  AlertTriangle, 
  PlusCircle, 
  MinusCircle, 
  History, 
  Loader2, 
  X, 
  Search, 
  TrendingUp, 
  PackageCheck
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStockAlert: number;
  unit: string;
}

interface StockAdjustment {
  id: string;
  reason: string;
  createdAt: string;
  items: {
    id: string;
    type: "ADD" | "SUBTRACT";
    quantity: number;
    product: { name: string; unit: string };
  }[];
}

interface AdjustmentInput {
  productId: string;
  type: "ADD" | "SUBTRACT";
  quantity: number | "";
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "low_stock" | "history">("overview");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [adjItems, setAdjItems] = useState<AdjustmentInput[]>([
    { productId: "", type: "SUBTRACT", quantity: 1 },
  ]);

  const fetchData = async () => {
    try {
      const [prodRes, adjRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/stock/adjustments"),
      ]);

      const [pData, aData] = await Promise.all([prodRes.json(), adjRes.json()]);

      if (pData.success) setProducts(pData.data);
      if (aData.success) setAdjustments(aData.data);
    } catch (err) {
      console.error("Failed to load stock data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // আইটেম যোগ করা
  const handleAddLine = () => {
    setAdjItems([...adjItems, { productId: "", type: "SUBTRACT", quantity: 1 }]);
  };

  // আইটেম রিমুভ করা
  const handleRemoveLine = (index: number) => {
    if (adjItems.length === 1) return;
    setAdjItems(adjItems.filter((_, i) => i !== index));
  };

  // স্টক অ্যাডজাস্টমেন্ট সাবমিট
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || adjItems.some((i) => !i.productId || !i.quantity)) {
      alert("Please fill all required adjustment fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/stock/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, items: adjItems }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setReason("");
        setAdjItems([{ productId: "", type: "SUBTRACT", quantity: 1 }]);
        fetchData();
      } else {
        alert(data.error || "Failed to submit adjustment");
      }
    } catch (err) {
      alert("Error submitting stock adjustment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ইনভেন্টরি ভ্যালু হিসাব
  const totalStockQuantity = products.reduce((sum, p) => sum + p.stock, 0);
  const totalInventoryCost = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);
  const totalPotentialValue = products.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0);

  const lowStockProducts = products.filter((p) => p.stock <= p.minStockAlert);
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-emerald-600" />
            Stock & Inventory Control
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track total stock valuation, low stock warnings, and manual stock adjustments.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Adjust Stock / Waste</span>
        </button>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Items in Stock</span>
          <p className="text-2xl font-bold text-slate-800">{totalStockQuantity.toLocaleString()} Units</p>
          <span className="text-[11px] text-slate-400">Across {products.length} unique products</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">Total Inventory Cost</span>
          <p className="text-2xl font-bold text-emerald-600">৳ {totalInventoryCost.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400">Total money tied in stock</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block">Low Stock Alerts</span>
          <p className="text-2xl font-bold text-amber-600">{lowStockProducts.length} Items Low</p>
          <span className="text-[11px] text-slate-400">Needs purchase order</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold text-slate-500">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 flex items-center gap-1.5 transition-all ${
            activeTab === "overview" ? "border-b-2 border-emerald-600 text-emerald-600" : "hover:text-slate-800"
          }`}
        >
          <PackageCheck className="w-4 h-4" /> All Stock Levels
        </button>

        <button
          onClick={() => setActiveTab("low_stock")}
          className={`pb-3 flex items-center gap-1.5 transition-all ${
            activeTab === "low_stock" ? "border-b-2 border-amber-600 text-amber-600" : "hover:text-slate-800"
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Low Stock Warning ({lowStockProducts.length})
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 flex items-center gap-1.5 transition-all ${
            activeTab === "history" ? "border-b-2 border-emerald-600 text-emerald-600" : "hover:text-slate-800"
          }`}
        >
          <History className="w-4 h-4" /> Adjustment Logs
        </button>
      </div>

      {/* TAB 1 & 2: STOCK TABLE */}
      {(activeTab === "overview" || activeTab === "low_stock") && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2 text-sm">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                Loading inventory...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">Product Name</th>
                      <th className="p-4">Cost Price</th>
                      <th className="p-4">Selling Price</th>
                      <th className="p-4">Current Stock</th>
                      <th className="p-4">Total Value</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {(activeTab === "low_stock" ? lowStockProducts : filteredProducts).map((p) => {
                      const isLow = p.stock <= p.minStockAlert;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-bold text-slate-900">{p.name}</td>
                          <td className="p-4 text-slate-600">৳ {p.costPrice.toLocaleString()}</td>
                          <td className="p-4 font-semibold text-slate-800">৳ {p.sellingPrice.toLocaleString()}</td>
                          <td className="p-4 font-bold">
                            {p.stock} {p.unit}
                          </td>
                          <td className="p-4 font-bold text-emerald-600">
                            ৳ {(p.stock * p.costPrice).toLocaleString()}
                          </td>
                          <td className="p-4 text-right">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                isLow
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              }`}
                            >
                              {isLow ? <AlertTriangle className="w-3.5 h-3.5" /> : null}
                              {isLow ? "Low Stock" : "In Stock"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ADJUSTMENT HISTORY */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {adjustments.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">No manual adjustment logs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Date / Reason</th>
                    <th className="p-4">Adjusted Items</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {adjustments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{a.reason}</div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(a.createdAt).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4 space-y-1">
                        {a.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.type === "ADD"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {item.type === "ADD" ? "+ ADD" : "- SUBTRACT"}
                            </span>
                            <span className="font-medium text-slate-700">
                              {item.product.name} ({item.quantity} {item.product.unit})
                            </span>
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADJUSTMENT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-600" />
                Manual Stock Adjustment / Damage
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason for Adjustment *</label>
                <input
                  type="text"
                  placeholder="e.g. Expired stock, Water damage, Found extra"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-2 border border-slate-200 p-3 rounded-xl bg-slate-50/50">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Products List</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-emerald-600 font-bold hover:underline"
                  >
                    + Add Item
                  </button>
                </div>

                {adjItems.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 bg-white p-2 rounded-xl border border-slate-200 items-center">
                    <div className="col-span-5">
                      <select
                        value={line.productId}
                        onChange={(e) => {
                          const newLines = [...adjItems];
                          newLines[idx].productId = e.target.value;
                          setAdjItems(newLines);
                        }}
                        className="w-full border border-slate-200 p-2 rounded-lg text-xs"
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <select
                        value={line.type}
                        onChange={(e) => {
                          const newLines = [...adjItems];
                          newLines[idx].type = e.target.value as "ADD" | "SUBTRACT";
                          setAdjItems(newLines);
                        }}
                        className="w-full border border-slate-200 p-2 rounded-lg text-xs font-bold"
                      >
                        <option value="SUBTRACT">- Damage</option>
                        <option value="ADD">+ Found</option>
                      </select>
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={line.quantity}
                        onChange={(e) => {
                          const newLines = [...adjItems];
                          newLines[idx].quantity = e.target.value === "" ? "" : Number(e.target.value);
                          setAdjItems(newLines);
                        }}
                        className="w-full border border-slate-200 p-2 rounded-lg text-xs font-bold"
                        required
                      />
                    </div>

                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/2 border border-slate-200 py-2.5 rounded-xl font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all"
                >
                  {isSubmitting ? "Saving..." : "Save Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}