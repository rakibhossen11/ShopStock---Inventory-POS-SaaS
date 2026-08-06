"use client";

import { useEffect, useState } from "react";
import { Store, RotateCw, User } from "lucide-react";

interface UserProfile {
  name: string;
  storeName?: string;
}

export default function TopHeader() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser({ name: "Rakib Hossen", storeName: "Rakib Telecome" });
        }
      })
      .catch(() => setCurrentUser({ name: "Rakib Hossen", storeName: "Rakib Telecome" }));
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
    <header className="bg-white border-b border-slate-200/80 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      {/* Store Badge */}
      <div className="flex items-center gap-2 bg-emerald-50/60 border border-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-semibold">
        <Store className="w-4 h-4 text-emerald-600" />
        <span>{currentUser?.storeName || "Rakib Telecome"}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Refresh Button */}
        <button
          onClick={() => window.location.reload()}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          title="Refresh Data"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2.5 bg-emerald-50/60 border border-emerald-100 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-800">
          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
            {currentUser?.name ? getInitials(currentUser.name) : "RA"}
          </div>
          <span>{currentUser?.name || "Rakib Hossen"}</span>
        </div>
      </div>
    </header>
  );
}