"use client";

import { useEffect, useState } from "react";
import { 
  FileText, 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  Printer, 
  User
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  stock: number;
  barcode?: string;
  unit: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  stock: number;
  unit: string;
}

export default function InvoiceSellPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [discount, setDiscount] = useState<number | "">(0);
  const [paidAmount, setPaidAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/customers"),
      ]);
      const [pData, cData] = await Promise.all([pRes.json(), cRes.json()]);

      if (pData.success) setProducts(pData.data);
      if (cData.success) setCustomers(cData.data);
    } catch (err) {
      console.error("Failed to load invoice sell data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert("Out of stock!");
      return;
    }
    const existing = cart.find((item) => item.productId === product.id);
    if (existing) {
      if (existing.quantity + 1 > product.stock) {
        alert("Stock limit reached!");
        return;
      }
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          unitPrice: product.sellingPrice,
          quantity: 1,
          stock: product.stock,
          unit: product.unit,
        },
      ]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.stock) {
              alert("Stock limit reached");
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const subTotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const grandTotal = subTotal - Number(discount || 0);
  const actualPaid = Number(paidAmount || 0);
  const dueAmount = grandTotal > actualPaid ? grandTotal - actualPaid : 0;

  const handleCompleteSell = async () => {
    if (cart.length === 0) return;
    if (!selectedCustomerId && dueAmount > 0) {
      alert("Please select a registered customer for due sales.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId || null,
          items: cart,
          discount: Number(discount) || 0,
          paidAmount: actualPaid,
          paymentMethod,
          isQuickSell: false,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCompletedSale(data.data);
        setCart([]);
        setDiscount(0);
        setPaidAmount("");
        setSelectedCustomerId("");
        fetchData();
      } else {
        alert(data.error || "Invoice sale failed");
      }
    } catch (err) {
      alert("Error processing transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-12">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" /> Invoice Sale (With Due & Customer Ledger)
        </h1>
        <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold">Standard Memo</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 pl-10 pr-4 py-3 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm min-h-[480px]">
            {loading ? (
              <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Loading catalog...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={p.stock <= 0}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      p.stock > 0
                        ? "border-slate-200 hover:border-blue-500 hover:shadow-md bg-white"
                        : "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-800 text-xs line-clamp-2">{p.name}</p>
                      <span className="text-[10px] text-slate-400 font-mono">Stock: {p.stock} {p.unit}</span>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-sm font-bold text-blue-600">৳{p.sellingPrice}</span>
                      <span className="bg-blue-50 text-blue-700 p-1 rounded-lg text-[10px] font-bold">+ Add</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-fit space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" /> Invoice Cart
              </h3>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Select Customer *</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="">-- Walk-in Customer (Cash Only) --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>

            <div className="max-h-[180px] overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl p-2 bg-slate-50/50 space-y-1">
              {cart.map((item) => (
                <div key={item.productId} className="flex justify-between items-center py-2 text-xs">
                  <div className="max-w-[140px]">
                    <p className="font-bold text-slate-800 truncate">{item.name}</p>
                    <span className="text-[10px] text-slate-400">৳{item.unitPrice}</span>
                  </div>

                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                    <button onClick={() => updateQuantity(item.productId, -1)} className="p-0.5 text-slate-500">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-slate-800 text-xs">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, 1)} className="p-0.5 text-slate-500">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="font-bold text-slate-900">৳{item.quantity * item.unitPrice}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
            <div className="space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Grand Total:</span>
                <span className="font-bold text-slate-900">৳{grandTotal}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Paid Amount (BDT):</span>
                <input
                  type="number"
                  placeholder={`e.g. ${grandTotal}`}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-24 border border-slate-200 p-1 rounded-lg text-right font-bold text-xs"
                />
              </div>

              <div className="flex justify-between text-rose-600 font-bold pt-1">
                <span>Calculated Due:</span>
                <span>৳{dueAmount}</span>
              </div>
            </div>

            <button
              onClick={handleCompleteSell}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Complete Invoice Order
            </button>
          </div>
        </div>
      </div>

      {completedSale && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-blue-600 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">Invoice Sale Recorded!</h3>
            <p className="text-xs text-slate-500">Memo: {completedSale.invoiceNo}</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setCompletedSale(null)} className="w-1/2 border border-slate-200 py-2 rounded-xl text-xs font-semibold">Close</button>
              <button onClick={() => window.print()} className="w-1/2 bg-blue-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1"><Printer className="w-4 h-4" /> Print Memo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}