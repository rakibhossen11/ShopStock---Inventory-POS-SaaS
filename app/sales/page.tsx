"use client";

import { useEffect, useState } from "react";
import { 
  ShoppingBag, 
  Search, 
  FileText, 
  Printer, 
  Loader2, 
  X, 
  CreditCard,
  UserCheck,
  CheckCircle2,
  AlertCircle
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

  // General Analytics (No Profit Data)
  const totalRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalPaidCollected = sales.reduce((sum, s) => sum + s.paidAmount, 0);
  const totalDuePending = sales.reduce((sum, s) => sum + s.dueAmount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 px-4 sm:px-6">
      
      {/* Header */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-emerald-500" />
            Sales Orders & Revenue History
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Review completed sales orders, track customer dues, and reprint receipts.
          </p>
        </div>
      </div>

      {/* 3 Metric Cards (No Profit Card) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Sales Revenue</span>
            <div className="p-2 bg-slate-100 rounded-xl text-slate-600"><ShoppingBag className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-black text-slate-900">৳ {totalRevenue.toLocaleString()}</p>
          <p className="text-[11px] font-medium text-slate-500">{sales.length} Invoices Generated</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Collected Cash</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><CreditCard className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-black text-emerald-600">৳ {totalPaidCollected.toLocaleString()}</p>
          <p className="text-[11px] font-medium text-slate-500">Payments Received</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Customer Dues</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><AlertCircle className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-black text-rose-600">৳ {totalDuePending.toLocaleString()}</p>
          <p className="text-[11px] font-medium text-rose-500">Pending Collections</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by invoice number, customer name, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50/80 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3 text-xs font-bold">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span>Fetching Sales History...</span>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs font-semibold">No sales orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Invoice & Date</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Total Bill</th>
                  <th className="p-4">Paid / Due</th>
                  <th className="p-4 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        {s.invoiceNo}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                        {new Date(s.createdAt).toLocaleString()}
                      </span>
                    </td>

                    <td className="p-4">
                      {s.customer ? (
                        <div>
                          <p className="font-bold text-slate-800 text-xs flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            {s.customer.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{s.customer.phone}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Walk-in Customer</span>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border border-slate-200">
                        {s.paymentMethod}
                      </span>
                    </td>

                    <td className="p-4 font-black text-slate-900 text-sm">
                      ৳ {s.grandTotal.toLocaleString()}
                    </td>

                    <td className="p-4 font-bold">
                      <span className="text-emerald-600 block flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Paid: ৳ {s.paidAmount.toLocaleString()}
                      </span>
                      {s.dueAmount > 0 && (
                        <span className="text-rose-600 block text-[11px] font-bold mt-0.5">
                          Due: ৳ {s.dueAmount.toLocaleString()}
                        </span>
                      )}
                    </td>

                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => setSelectedSale(s)}
                        className="bg-slate-900 hover:bg-emerald-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 ml-auto"
                      >
                        <FileText className="w-3.5 h-3.5" /> Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECEIPT MODAL (Without Profit) */}
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Sales Receipt ({selectedSale.invoiceNo})
              </h3>
              <button onClick={() => setSelectedSale(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs bg-slate-50 p-5 rounded-2xl border border-slate-200 font-mono">
              <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-0.5">
                <p className="font-black text-slate-900 text-base">SHOPSTOCK POS</p>
                <p className="text-[10px] text-slate-500">Invoice: {selectedSale.invoiceNo}</p>
                <p className="text-[10px] text-slate-400">{new Date(selectedSale.createdAt).toLocaleString()}</p>
                <p className="text-[11px] text-slate-700 font-bold mt-1">
                  Customer: {selectedSale.customer?.name || "Walk-in Customer"}
                </p>
              </div>

              <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
                {selectedSale.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-slate-800">
                    <div>
                      <span className="font-bold block">{item.product.name}</span>
                      <span className="text-slate-400 text-[10px]">
                        {item.quantity} {item.product.unit} x ৳{item.unitPrice}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900">৳{item.totalPrice}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between font-black text-slate-900 text-sm pt-1">
                  <span>Grand Total:</span>
                  <span>৳{selectedSale.grandTotal}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Paid ({selectedSale.paymentMethod}):</span>
                  <span>৳{selectedSale.paidAmount}</span>
                </div>
                {selectedSale.dueAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Due Balance:</span>
                    <span>৳{selectedSale.dueAmount}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}