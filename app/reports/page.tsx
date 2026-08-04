"use client";

import { useEffect, useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Receipt, 
  Boxes, 
  Users, 
  Truck, 
  Loader2, 
  Calendar,
  PieChart
} from "lucide-react";

interface ReportMetrics {
  totalSalesRevenue: number;
  totalPaidCollected: number;
  totalSalesDue: number;
  totalCOGS: number;
  grossProfit: number;
  totalExpensesAmount: number;
  netProfit: number;
  totalInventoryCost: number;
  totalInventorySalesValue: number;
  customerDuesReceivable: number;
  supplierPayable: number;
}

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [ordersCount, setOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("this_month");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?filter=${filter}`);
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data.metrics);
        setOrdersCount(data.data.ordersCount);
      }
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filter]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header & Date Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-emerald-600" />
            Business Reports & Profit Loss
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time financial performance, margins, and inventory valuation statement.
          </p>
        </div>

        {/* Date Filter Dropdown */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <Calendar className="w-4 h-4 text-slate-500 ml-2" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-700 py-1.5 pr-3 focus:outline-none cursor-pointer"
          >
            <option value="today">Today</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="this_month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center text-slate-500 flex items-center justify-center gap-2 text-sm">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          Calculating reports & margins...
        </div>
      ) : metrics ? (
        <>
          {/* Main Profit & Loss Statement Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-lg space-y-6">
            <div className="flex justify-between items-center border-b border-slate-700 pb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Net Profit Statement ({filter.replace("_", " ").toUpperCase()})
              </span>
              <span className="text-xs bg-slate-800 text-emerald-400 font-bold px-3 py-1 rounded-full border border-slate-700">
                {ordersCount} Invoices Processed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Total Sales Revenue</span>
                <p className="text-2xl font-black mt-1 text-white">৳ {metrics.totalSalesRevenue.toLocaleString()}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 block font-medium">Cost of Goods Sold (COGS)</span>
                <p className="text-2xl font-bold mt-1 text-amber-400">- ৳ {metrics.totalCOGS.toLocaleString()}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 block font-medium">Total Shop Expenses</span>
                <p className="text-2xl font-bold mt-1 text-rose-400">- ৳ {metrics.totalExpensesAmount.toLocaleString()}</p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
                <span className="text-xs text-slate-300 block font-bold uppercase tracking-wider">Net Profit</span>
                <p className={`text-2xl font-black mt-1 ${metrics.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  ৳ {metrics.netProfit.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sales & Cashflow Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                Sales & Cash Inflow Breakdown
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">Gross Sales Volume:</span>
                  <span className="font-bold text-slate-900">৳ {metrics.totalSalesRevenue.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">Actual Cash / Digital Collected:</span>
                  <span className="font-bold text-emerald-600">৳ {metrics.totalPaidCollected.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-t border-slate-100 pt-2">
                  <span className="text-slate-600">Customer Dues (This Period):</span>
                  <span className="font-bold text-rose-600">৳ {metrics.totalSalesDue.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-1 bg-emerald-50 p-2.5 rounded-xl text-emerald-900 font-bold">
                  <span>Gross Margin (Revenue - COGS):</span>
                  <span>৳ {metrics.grossProfit.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Inventory Asset Valuation Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                <Boxes className="w-5 h-5 text-blue-600" />
                Inventory Valuation & Dues Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">Current Stock Asset Value (Cost):</span>
                  <span className="font-bold text-slate-900">৳ {metrics.totalInventoryCost.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">Expected Stock Value (Selling):</span>
                  <span className="font-bold text-blue-600">৳ {metrics.totalInventorySalesValue.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-t border-slate-100 pt-2">
                  <span className="text-slate-600">Total All-Time Customer Dues:</span>
                  <span className="font-bold text-rose-600">৳ {metrics.customerDuesReceivable.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">Total Supplier Payable Dues:</span>
                  <span className="font-bold text-amber-600">৳ {metrics.supplierPayable.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}