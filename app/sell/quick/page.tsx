"use client";

import { useEffect, useState } from "react";
import { 
  Zap, 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  Printer
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  stock: number;
  barcode?: string;
  unit: string;
}

interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  stock: number;
  unit: string;
}

export default function QuickSellPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [discount, setDiscount] = useState<number | "">(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch (err) {
      console.error("Failed to load products", err);
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

  const handleCompleteSell = async () => {
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: null,
          items: cart,
          discount: Number(discount) || 0,
          paidAmount: grandTotal,
          paymentMethod: "CASH",
          isQuickSell: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCompletedSale(data.data);
        setCart([]);
        setDiscount(0);
        fetchData();
      } else {
        alert(data.error || "Quick sell failed");
      }
    } catch (err) {
      alert("Error completing transaction");
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
          <Zap className="w-6 h-6 text-emerald-600" /> Quick Sale (Instant Cash Terminal)
        </h1>
        <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold">Fast POS</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Scan barcode or search product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 pl-10 pr-4 py-3 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm min-h-[480px]">
            {loading ? (
              <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> Loading products...
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
                        ? "border-slate-200 hover:border-emerald-500 hover:shadow-md bg-white"
                        : "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-800 text-xs line-clamp-2">{p.name}</p>
                      <span className="text-[10px] text-slate-400 font-mono">Stock: {p.stock} {p.unit}</span>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-sm font-bold text-emerald-600">৳{p.sellingPrice}</span>
                      <span className="bg-emerald-50 text-emerald-700 p-1 rounded-lg text-[10px] font-bold">+ Add</span>
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
                <ShoppingCart className="w-4 h-4 text-emerald-600" /> Quick Cart
              </h3>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-[11px] text-rose-600 font-semibold hover:underline">
                  Clear
                </button>
              )}
            </div>

            <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl p-2 bg-slate-50/50 space-y-1">
              {cart.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Cart is empty. Click items to add.</div>
              ) : (
                cart.map((item) => (
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

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">৳{item.quantity * item.unitPrice}</span>
                      <button onClick={() => removeFromCart(item.productId)} className="text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">৳{subTotal}</span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>Discount (BDT):</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-20 border border-slate-200 p-1 rounded-lg text-right font-bold text-xs"
              />
            </div>

            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex justify-between items-center font-bold text-slate-900">
              <span>Payable Cash:</span>
              <span className="text-lg text-emerald-700">৳{grandTotal}</span>
            </div>

            <button
              onClick={handleCompleteSell}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Complete Quick Sale
            </button>
          </div>
        </div>
      </div>

      {completedSale && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">Quick Sale Done!</h3>
            <p className="text-xs text-slate-500">Invoice: {completedSale.invoiceNo}</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setCompletedSale(null)} className="w-1/2 border border-slate-200 py-2 rounded-xl text-xs font-semibold">Close</button>
              <button onClick={() => window.print()} className="w-1/2 bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1"><Printer className="w-4 h-4" /> Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}