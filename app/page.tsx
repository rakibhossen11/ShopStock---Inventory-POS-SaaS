"use client";

import { useEffect, useState } from "react";
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  AlertTriangle, 
  RotateCcw, 
  Plus, 
  Printer, 
  ArrowDownLeft, 
  ChevronDown,
  Loader2,
  FileText,
  Store,
  User as UserIcon
} from "lucide-react";
import Link from "next/link";

interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  reorder: number;
}

interface RecentSale {
  id: string;
  invoiceNo: string;
  grandTotal: number;
  createdAt: string;
  customer?: { name: string };
}

interface UserData {
  name: string;
  email: string;
  storeName: string;
}

interface DashboardData {
  user: UserData;
  todaySalesAmount: number;
  todayOrdersCount: number;
  stockValueCost: number;
  lowStockCount: number;
  lowStockItems: LowStockItem[];
  recentSales: RecentSale[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 bg-slate-100 px-3.5 py-2 rounded-xl">
            <Store className="w-4 h-4 text-emerald-600" />
            <span>{data?.user?.storeName || "Store Account"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button 
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* User Profile Info */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold uppercase">
              {data?.user?.name ? data.user.name.substring(0, 2) : "US"}
            </div>
            <span className="text-xs font-bold text-slate-800">{data?.user?.name || "User"}</span>
          </div>
        </div>
      </div>

      {/* Greeting Title */}
      <div>
        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">TODAY AT A GLANCE</p>
        <h1 className="text-2xl font-bold text-slate-900">
          Good day, {data?.user?.name || "Manager"} 👋
        </h1>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 flex items-center justify-center gap-2 text-sm bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          Loading store metrics...
        </div>
      ) : data ? (
        <>
          {/* Top Metrics Cards (5 Stats) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Today's Sales */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Today's sales</span>
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">
                  ৳{data.todaySalesAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-400 mt-1">{data.todayOrdersCount} orders</div>
              </div>
            </div>

            {/* Orders Today */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Orders today</span>
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{data.todayOrdersCount}</div>
                <div className="text-xs text-slate-400 mt-1">Completed</div>
              </div>
            </div>

            {/* Stock Value */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Stock value</span>
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">
                  ৳{data.stockValueCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-400 mt-1">At cost</div>
              </div>
            </div>

            {/* Low Stock Alert */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Low stock</span>
                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-amber-600">{data.lowStockCount}</div>
                <div className="text-xs text-amber-600 mt-1">
                  {data.lowStockCount > 0 ? "Needs attention" : "Stock healthy"}
                </div>
              </div>
            </div>

            {/* Refunds Today */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Refunds today</span>
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <RotateCcw className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">0</div>
                <div className="text-xs text-slate-400 mt-1">None</div>
              </div>
            </div>
          </div>

          {/* Main Content Grid: Recent Sales & Low-Stock Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side: Recent Sales Feed */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[320px]">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Recent Sales
                </h3>
                <Link href="/sales" className="text-xs text-emerald-600 hover:underline font-semibold">
                  View all sales
                </Link>
              </div>

              {data.recentSales.length === 0 ? (
                <div className="flex flex-col items-center justify-center my-auto text-center space-y-4 py-8">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">No sales yet today</h3>
                    <p className="text-xs text-slate-400 mt-1">Open the sell screen to ring up your first sale.</p>
                  </div>
                  <Link
                    href="/sell/quick"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New sale</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recentSales.map((sale) => (
                    <div key={sale.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="font-bold text-slate-800">{sale.invoiceNo}</p>
                          <span className="text-slate-400 text-[10px]">
                            {sale.customer?.name || "Walk-in Customer"} · {new Date(sale.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 text-sm">৳{sale.grandTotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side: Low-Stock Alerts & Quick Actions */}
            <div className="space-y-6">
              {/* Low-stock Alerts Box */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-800">Low-stock alerts</h3>
                  <Link href="/stock" className="text-xs text-emerald-600 hover:underline font-medium">
                    View all
                  </Link>
                </div>

                <div className="space-y-3">
                  {data.lowStockItems.length === 0 ? (
                    <p className="text-xs text-slate-400 p-4 text-center">All product stocks are healthy!</p>
                  ) : (
                    data.lowStockItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{item.name}</p>
                            <p className="text-xs text-slate-400">
                              {item.stock} in stock · reorder at {item.reorder}
                            </p>
                          </div>
                        </div>
                        <Link
                          href="/purchases"
                          className="text-xs border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-100 text-slate-700 font-medium transition-colors"
                        >
                          Restock
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="space-y-2">
                <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">Quick actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/sell/quick"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl flex flex-col justify-between h-20 transition-all shadow-sm"
                  >
                    <Plus className="w-5 h-5" />
                    <div>
                      <div className="text-sm font-semibold">New sale</div>
                      <div className="text-[10px] opacity-80">Ring up a customer</div>
                    </div>
                  </Link>

                  <Link
                    href="/products"
                    className="bg-white border border-slate-200 hover:bg-slate-50 p-3 rounded-xl flex flex-col justify-between h-20 transition-all shadow-sm"
                  >
                    <Plus className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="text-sm font-semibold text-slate-800">Add product</div>
                      <div className="text-[10px] text-slate-400">New catalog item</div>
                    </div>
                  </Link>

                  <Link
                    href="/purchases"
                    className="bg-white border border-slate-200 hover:bg-slate-50 p-3 rounded-xl flex flex-col justify-between h-20 transition-all shadow-sm"
                  >
                    <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="text-sm font-semibold text-slate-800">Receive stock</div>
                      <div className="text-[10px] text-slate-400">Log a delivery</div>
                    </div>
                  </Link>

                  <Link
                    href="/products"
                    className="bg-white border border-slate-200 hover:bg-slate-50 p-3 rounded-xl flex flex-col justify-between h-20 transition-all shadow-sm"
                  >
                    <Printer className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="text-sm font-semibold text-slate-800">Print labels</div>
                      <div className="text-[10px] text-slate-400">Barcode labels</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}