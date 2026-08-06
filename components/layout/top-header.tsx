"use client";

import { useEffect, useState } from "react";
import { Store, RotateCw } from "lucide-react";
import { useAuthStore } from "@/app/stores/useAuthStore";

export function TopHeader() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white border-b border-slate-200/80 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Store Name Badge */}
      <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-100/80 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-semibold">
        <Store className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>{mounted && user?.storeName ? user.storeName : "Rakib Telecome"}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Refresh Page Button */}
        <button
          onClick={() => window.location.reload()}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
          title="Refresh Data"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* User Profile Badge */}
        {mounted && user && (
          <div className="flex items-center gap-2.5 bg-emerald-50/70 border border-emerald-100/80 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-800">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center uppercase shrink-0">
              {getInitials(user.name || "Rakib Hossen")}
            </div>
            <span>{user.name}</span>
          </div>
        )}
      </div>
    </header>
  );
}