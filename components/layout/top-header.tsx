"use client";

import { useEffect, useState } from "react";
import { 
  Store, 
  RotateCw, 
  Bell, 
  Maximize, 
  Minimize, 
  Clock, 
  Plus, 
  ChevronDown, 
  Sparkles,
  X,
  Mail,
  LogOut,
  Calendar
} from "lucide-react";
import { useAuthStore } from "@/app/stores/useAuthStore";
import Link from "next/link";

export function TopHeader() {
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    
    // Live Time & Date Update
    const updateDateTime = () => {
      const now = new Date();

      // Time Format: 10:00:00 AM
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );

      // Date Format: 8 August 2026
      const day = now.getDate();
      const month = now.toLocaleDateString("en-US", { month: "long" });
      const year = now.getFullYear();
      setCurrentDate(`${day} ${month} ${year}`);
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-2 flex items-center justify-between sticky top-0 z-40 shadow-xs select-none">
      
      {/* 1. LEFT SIDE: STORE BADGE, LIVE CLOCK & DATE */}
      <div className="flex items-center gap-3">
        {/* Store Name Badge */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/70 text-emerald-900 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-2xs">
          <Store className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{mounted && user?.storeName ? user.storeName : "Rakib Telecome"}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
        </div>

        {/* Real-time Clock & Date Badge */}
        <div className="hidden md:flex flex-col text-xs bg-slate-100/80 border border-slate-200/80 px-3 py-1 rounded-xl">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
            <Clock className="w-3 h-3 text-emerald-600" />
            <span className="font-mono text-[11px]">{currentTime || "10:00:00 AM"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-semibold mt-0.5">
            <Calendar className="w-2.5 h-2.5 text-slate-400" />
            <span>{currentDate || "8 August 2026"}</span>
          </div>
        </div>
      </div>

      {/* 2. RIGHT SIDE: CONTROLS & USER PROFILE */}
      <div className="flex items-center gap-2.5">
        
        {/* Quick New Sale Shortcut Button */}
        <Link
          href="/pos"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 shadow-xs hover:shadow-emerald-200"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Sale</span>
        </Link>

        <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

        {/* Refresh Page Button */}
        <button
          onClick={() => window.location.reload()}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
          title="Refresh Workspace"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all cursor-pointer hidden sm:flex"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen POS Mode"}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        {/* Notifications Dropdown Toggle */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all cursor-pointer relative"
            title="System Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-white" />
          </button>

          {/* Notifications Modal */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 space-y-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Notifications
                </span>
                <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                  <p className="font-bold text-slate-800">System Ready</p>
                  <p className="text-slate-500">All MFS and Flexiload services are operational.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. CLICKABLE USER PROFILE BADGE */}
        {mounted && user && (
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/80 p-1 pl-1.5 pr-2.5 rounded-full text-xs font-bold text-slate-800 transition-all cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center uppercase shrink-0 shadow-2xs">
                {getInitials(user.name || "Rakib Hossen")}
              </div>
              <span className="max-w-[110px] truncate">{user.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`} />
            </button>

            {/* USER INFORMATION CARD MODAL */}
            {showUserMenu && (
              <div 
                onMouseLeave={() => setShowUserMenu(false)}
                className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 space-y-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Profile Header */}
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center uppercase shadow-xs">
                    {getInitials(user.name || "Rakib Hossen")}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-slate-900 truncate text-sm">{user.name}</h4>
                    <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mt-0.5">
                      {user.role || "STORE_OWNER"}
                    </span>
                  </div>
                </div>

                {/* Info Details */}
                <div className="space-y-2 text-slate-600 font-medium text-[11px]">
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{user.email || "owner@rakibtelecom.com"}</span>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl">
                    <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-bold text-slate-800">{user.storeName || "Rakib Telecome"}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-1 space-y-1.5">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-rose-100 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}