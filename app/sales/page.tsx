"use client";

import { useEffect, useState } from "react";
import { 
  ShoppingBag, 
  Search, 
  FileText, 
  Calendar, 
  Printer, 
  Loader2, 
  X, 
  CheckCircle2, 
  Clock,
  DollarSign
} from "lucide-react";

interface SaleItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: { name: string; unit: string };
}

interface SaleOrder {
  id: string;
  invoiceNo: string;
  subTotal: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  createdAt: string;
  customer?: { name: string; phone: string };
  items: SaleItem[];
}

export default function SalesPage() {
  const [sales, setSales] = useState<SaleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Invoice Modal State
  const [selectedSale, setSelectedSale] = useState<SaleOrder | null>(null);

  const fetchSales = async () => {
    try {
      const res = await fetch("/api/sales");
      const data = await res.json();
      if (data.success) setSales(data.data);
    } catch (err) {
      console.error("Failed to load sales history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const filteredSales = sales.filter(
    (s) =>
      s.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.customer?.name && s.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.customer?.phone && s.customer.phone.includes(searchTerm))
  );

  // হিসাবসমূহ
  const totalRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalPaidCollected = sales.reduce((sum, s) => sum + s.paidAmount, 0);
  const totalDuePending = sales.reduce((sum, s) => sum + s.dueAmount, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-emerald-600" />
            Sales History & Orders
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review past sales invoices, track revenue collections, and reprint receipts.
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Sales Value</span>
          <p className="text-2xl font-bold text-slate-900">৳ {totalRevenue.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400">{sales.length} Invoices Generated</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">Cash / Collected</span>
          <p className="text-2xl font-bold text-emerald-600">৳ {totalPaidCollected.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400">Total Money Received</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider block">Total Customer Dues</span>
          <p className="text-2xl font-bold text-rose-600">৳ {totalDuePending.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400">Pending collections</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search by invoice number, customer name, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            Loading sales history...
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No sales orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Invoice / Date</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Total Bill</th>
                  <th className="p-4">Paid / Due</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        {s.invoiceNo}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {new Date(s.createdAt).toLocaleString()}
                      </span>
                    </td>

                    <td className="p-4 font-semibold text-slate-800">
                      {s.customer ? (
                        <div>
                          <p>{s.customer.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal">{s.customer.phone}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">Walk-in Customer</span>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase">
                        {s.paymentMethod}
                      </span>
                    </td>

                    <td className="p-4 font-bold text-slate-900">
                      ৳ {s.grandTotal.toLocaleString()}
                    </td>

                    <td className="p-4 font-bold">
                      <span className="text-emerald-600 block">
                        Paid: ৳ {s.paidAmount.toLocaleString()}
                      </span>
                      {s.dueAmount > 0 && (
                        <span className="text-rose-600 block text-[11px]">
                          Due: ৳ {s.dueAmount.toLocaleString()}
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedSale(s)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INVOICE VIEW MODAL */}
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Sales Receipt ({selectedSale.invoiceNo})
              </h3>
              <button onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Printable Area */}
            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
              <div className="text-center border-b border-dashed border-slate-300 pb-3">
                <p className="font-bold text-slate-900 text-sm">SHOPSTOCK STORE</p>
                <p className="text-[10px] text-slate-500">Invoice: {selectedSale.invoiceNo}</p>
                <p className="text-[10px] text-slate-500">{new Date(selectedSale.createdAt).toLocaleString()}</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Customer: {selectedSale.customer?.name || "Walk-in Customer"}
                </p>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
                {selectedSale.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-slate-700">
                    <div>
                      <span>{item.product.name}</span>
                      <span className="text-slate-400 text-[10px] block">
                        {item.quantity} x ৳{item.unitPrice}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900">৳{item.totalPrice}</span>
                  </div>
                ))}
              </div>

              {/* Calculation Summary */}
              <div className="space-y-1 text-slate-700 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>৳{selectedSale.subTotal}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>-৳{selectedSale.discount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-300">
                  <span>Grand Total:</span>
                  <span>৳{selectedSale.grandTotal}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Paid ({selectedSale.paymentMethod}):</span>
                  <span>৳{selectedSale.paidAmount}</span>
                </div>
                {selectedSale.dueAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Due Balance:</span>
                    <span>৳{selectedSale.dueAmount}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}