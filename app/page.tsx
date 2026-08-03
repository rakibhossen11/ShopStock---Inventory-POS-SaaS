"use client";

import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  AlertTriangle, 
  RotateCcw, 
  Plus, 
  Printer, 
  ArrowDownLeft, 
  ChevronDown 
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  // লো-স্টক ডাটা (নমুনা ডেমো ডাটা)
  const lowStockItems = [
    { id: 1, name: "Alu", stock: -2, reorder: 5 },
    { id: 2, name: "Alu", stock: -1, reorder: 5 },
    { id: 3, name: "Alu", stock: 0, reorder: 5 },
    { id: 4, name: "Pepe", stock: 2, reorder: 5 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
            <span>تموينات أطياف طيبة تا</span>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
              MR
            </div>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Greeting Title */}
      <div>
        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">TODAY AT A GLANCE</p>
        <h1 className="text-2xl font-bold text-slate-900">Good afternoon, Md.</h1>
      </div>

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
            <div className="text-xl font-bold text-slate-900">0.00 <span className="text-xs font-semibold text-slate-500">SAR</span></div>
            <div className="text-xs text-slate-400 mt-1">0 orders</div>
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
            <div className="text-xl font-bold text-slate-900">0</div>
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
            <div className="text-xl font-bold text-slate-900">162,400.00 <span className="text-xs font-semibold text-slate-500">SAR</span></div>
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
            <div className="text-xl font-bold text-amber-600">4</div>
            <div className="text-xs text-amber-600 mt-1">Needs attention</div>
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
        {/* Left Side: Recent Sales Placeholder */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">No sales yet today</h3>
            <p className="text-xs text-slate-400 mt-1">Open the sell screen to ring up your first sale..</p>
          </div>
          <Link
            href="/sell/quick"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New sale</span>
          </Link>
        </div>

        {/* Right Side: Low-Stock Alerts & Quick Actions */}
        <div className="space-y-6">
          {/* Low-stock Alerts Box */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-800">Low-stock alerts</h3>
              <button className="text-xs text-emerald-600 hover:underline font-medium">View all</button>
            </div>

            <div className="space-y-3">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.stock} in stock · reorder at {item.reorder}</p>
                    </div>
                  </div>
                  <button className="text-xs border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-100 text-slate-700 font-medium transition-colors">
                    Restock
                  </button>
                </div>
              ))}
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
                href="/products/new"
                className="bg-white border border-slate-200 hover:bg-slate-50 p-3 rounded-xl flex flex-col justify-between h-20 transition-all shadow-sm"
              >
                <Plus className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="text-sm font-semibold text-slate-800">Add product</div>
                  <div className="text-[10px] text-slate-400">New catalog item</div>
                </div>
              </Link>

              <Link
                href="/stock/receive"
                className="bg-white border border-slate-200 hover:bg-slate-50 p-3 rounded-xl flex flex-col justify-between h-20 transition-all shadow-sm"
              >
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="text-sm font-semibold text-slate-800">Receive stock</div>
                  <div className="text-[10px] text-slate-400">Log a delivery</div>
                </div>
              </Link>

              <Link
                href="/products/labels"
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
    </div>
  );
}