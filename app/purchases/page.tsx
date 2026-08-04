"use client";

import { useEffect, useState } from "react";
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Loader2, 
  FileText, 
  Building2, 
  Calendar, 
  DollarSign,
  Search,
  CheckCircle2,
  X
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  costPrice: number;
}

interface PurchaseItemInput {
  productId: string;
  quantity: number | "";
  unitPrice: number | "";
}

interface PurchaseOrder {
  id: string;
  invoiceNo: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  createdAt: string;
  supplier: { name: string; phone: string };
  items: { id: string; quantity: number; unitPrice: number; product: { name: string } }[];
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [paidAmount, setPaidAmount] = useState<number | "">(0);
  const [note, setNote] = useState("");
  const [items, setItems] = useState<PurchaseItemInput[]>([
    { productId: "", quantity: 1, unitPrice: "" },
  ]);

  const fetchData = async () => {
    try {
      const [purchasesRes, suppliersRes, productsRes] = await Promise.all([
        fetch("/api/purchases"),
        fetch("/api/suppliers"),
        fetch("/api/products"), // ধরে নেওয়া হচ্ছে প্রোডাক্ট এপিআই আছে
      ]);

      const [pData, sData, prData] = await Promise.all([
        purchasesRes.json(),
        suppliersRes.json(),
        productsRes.json(),
      ]);

      if (pData.success) setPurchases(pData.data);
      if (sData.success) setSuppliers(sData.data);
      if (prData.success) setProducts(prData.data);
    } catch (err) {
      console.error("Failed to load purchase data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // আইটেম সারি যোগ করা
  const handleAddItem = () => {
    setItems([...items, { productId: "", quantity: 1, unitPrice: "" }]);
  };

  // আইটেম মুছে ফেলা
  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // প্রোডাক্ট সিলেক্ট করলে ডিফল্ট ক্রয়মূল্য বসানো
  const handleProductChange = (index: number, pId: string) => {
    const selectedProd = products.find((p) => p.id === pId);
    const newItems = [...items];
    newItems[index].productId = pId;
    if (selectedProd) {
      newItems[index].unitPrice = selectedProd.costPrice || 0;
    }
    setItems(newItems);
  };

  // মোট পারচেজ হিসাব
  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
    0
  );

  const dueAmount = totalAmount - Number(paidAmount || 0);

  // পারচেজ ফর্ম সাবমিট
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !invoiceNo || items.some((i) => !i.productId || !i.quantity || !i.unitPrice)) {
      alert("Please fill all required fields correctly.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          invoiceNo,
          paidAmount: Number(paidAmount) || 0,
          note,
          items,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setSupplierId("");
        setInvoiceNo("");
        setPaidAmount(0);
        setNote("");
        setItems([{ productId: "", quantity: 1, unitPrice: "" }]);
        fetchData();
      } else {
        alert(data.error || "Failed to create purchase order");
      }
    } catch (err) {
      alert("Error processing purchase order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-emerald-600" />
            Purchase Orders
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Record incoming stock, vendor invoices, and manage supplier dues.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Purchase</span>
        </button>
      </div>

      {/* Purchases List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            Loading purchases...
          </div>
        ) : purchases.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No purchase records found. Click "Create New Purchase" to add one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Invoice / Date</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Items Count</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Paid / Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        {p.invoiceNo}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="p-4 font-semibold text-slate-800">
                      {p.supplier?.name || "N/A"}
                    </td>

                    <td className="p-4 font-medium text-slate-600">
                      {p.items?.length || 0} Products
                    </td>

                    <td className="p-4 font-bold text-slate-900">
                      ৳ {p.totalAmount.toLocaleString()}
                    </td>

                    <td className="p-4">
                      <div className="space-y-0.5 font-bold">
                        <span className="text-emerald-600 block">
                          Paid: ৳ {p.paidAmount.toLocaleString()}
                        </span>
                        {p.dueAmount > 0 && (
                          <span className="text-rose-600 block text-[11px]">
                            Due: ৳ {p.dueAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE PURCHASE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                New Purchase Entry
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Select Supplier *</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    required
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Supplier Invoice / Memo No. *</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-9021"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-slate-50/50">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-xs">Purchase Products</h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-emerald-600 hover:text-emerald-700 font-bold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product Line
                  </button>
                </div>

                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="col-span-5">
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        className="w-full border border-slate-200 p-2 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map((pr) => (
                          <option key={pr.id} value={pr.id}>{pr.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].quantity = e.target.value === "" ? "" : Number(e.target.value);
                          setItems(newItems);
                        }}
                        className="w-full border border-slate-200 p-2 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        min="0"
                        placeholder="Unit Price"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].unitPrice = e.target.value === "" ? "" : Number(e.target.value);
                          setItems(newItems);
                        }}
                        className="w-full border border-slate-200 p-2 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div className="col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary & Payment */}
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Grand Total Amount:</span>
                  <span className="text-base text-emerald-700">৳ {totalAmount.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Paid Amount (BDT)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Due Amount (Calculated)</label>
                    <div className="p-2.5 font-bold text-rose-600 bg-white border border-slate-200 rounded-xl">
                      ৳ {dueAmount > 0 ? dueAmount.toLocaleString() : 0}
                    </div>
                  </div>
                </div>
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
                  {isSubmitting ? "Processing..." : "Complete Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}