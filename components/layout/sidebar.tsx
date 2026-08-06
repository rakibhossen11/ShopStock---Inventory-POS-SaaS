"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  ShoppingCart, 
  Package, 
  Layers, 
  DollarSign, 
  Users, 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  ShieldCheck, 
  UserCheck, 
  BarChart3, 
  Headphones, 
  Settings,
  ChevronDown,
  Smartphone,
  Wallet,
  LogOut
} from "lucide-react";
import { useState, useEffect } from "react";
import { NavItem } from "@/types/nav";
import { useAuthStore } from "@/app/stores/useAuthStore";

const navItems: NavItem[] = [
  { title: "Home", href: "/", icon: Home },
  { 
    title: "Sell", 
    href: "/sell", 
    icon: ShoppingCart,
    subItems: [
      { title: "Quick sale", href: "/sell/quick" },
      { title: "Invoice sale", href: "/sell/invoice" }
    ]
  },
  { 
    title: "MFS & Recharge", 
    href: "/mfs", 
    icon: Smartphone,
    subItems: [
      { title: "Dashboard & Wallets", href: "/mfs" },
      { title: "MFS Sell", href: "/mfs/sell" },
      { title: "MFS Stock", href: "/mfs/stock" },
      { title: "Agent Wallets", href: "/mfs/agentwallet" },
      { title: "Personal Wallets", href: "/mfs/personal" },
      { title: "New Transaction", href: "/mfs/transaction" },
      { title: "Mobile Recharge", href: "/mfs/recharge" },
      { title: "History & Profit", href: "/mfs/history" },
      { title: "MFS Settings", href: "/mfs/settings" }
    ]
  },
  { title: "Products", href: "/products", icon: Package },
  { title: "Stock", href: "/stock", icon: Layers },
  { title: "Sales", href: "/sales", icon: DollarSign },
  { title: "Customers", href: "/customers", icon: Users },
  { title: "Purchases", href: "/purchases", icon: ShoppingBag },
  { title: "Suppliers", href: "/suppliers", icon: Truck },
  { title: "Payments", href: "/payments", icon: CreditCard },
  { title: "Warranty", href: "/warranty", icon: ShieldCheck },
  { title: "Staff", href: "/staff", icon: UserCheck },
  {
      title: "Cash Drawer", // 👈 ক্যাশ ড্রয়ার মেনু যোগ করা হলো
      href: "/cash-register",
      icon: Wallet,
      // roles: ["STORE_OWNER", "MANAGER", "CASHIER"],
    },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Support", href: "/support", icon: Headphones },
  { 
    title: "Settings", 
    href: "/settings", 
    icon: Settings,
    subItems: [
      { title: "Store Setup", href: "/settings/store-setup" },
      { title: "Invoice sale", href: "/settings/invoice" }
    ] 
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // প্রতিটি ড্রপডাউনের জন্য আলাদা স্টেট (Array of open titles)
  const [openMenus, setOpenMenus] = useState<string[]>(["Sell", "MFS & Recharge"]);

  // Hydration mismatch রোধ করার জন্য useEffect
  useEffect(() => {
    setMounted(true);
  }, []);

  // ড্রপডাউন টগল করার ফাংশন
  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 min-h-screen p-4 flex flex-col justify-between select-none shrink-0">
      <div>
        {/* Logo Section */}
        <div className="flex items-center gap-2 px-3 py-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
            S
          </div>
          <span className="font-bold text-xl text-slate-800">ShopStock</span>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isOpen = openMenus.includes(item.title);

            if (hasSubItems) {
              const isSubActive = item.subItems?.some((sub) => pathname === sub.href);

              return (
                <div key={item.title} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isSubActive 
                        ? "text-emerald-700 bg-emerald-50 font-semibold" 
                        : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isSubActive ? "text-emerald-600" : "text-slate-500"}`} />
                      <span>{item.title}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* সাব-আইটেম রেন্ডারিং */}
                  {isOpen && (
                    <div className="pl-9 space-y-1">
                      {item.subItems?.map((sub) => {
                        const isChildActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.title}
                            href={sub.href}
                            className={`block px-3 py-1.5 text-xs rounded-md transition-colors ${
                              isChildActive
                                ? "text-emerald-700 bg-emerald-100/60 font-semibold"
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/40"
                            }`}
                          >
                            {sub.title}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.title}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-500"}`} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Footer Section */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        {/* User Session Info Card */}
        {mounted && user && (
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                {user.name?.[0] || "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded uppercase">
                  {user.role}
                </span>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="w-full text-xs font-semibold text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-rose-100"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Footer Version Info */}
        <div className="text-xs text-slate-400 px-1 flex justify-between items-center">
          <span>ShopStock v0.1.0</span>
          <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-medium">SaaS</span>
        </div>
      </div>
    </aside>
  );
}