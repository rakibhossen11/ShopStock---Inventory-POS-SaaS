"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopHeader } from "@/components/layout/top-header";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // চেক করা হচ্ছে ইউজার Auth Page-এ আছে কি না
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (isAuthPage) {
    // লগইন বা রেজিস্টার পেজে থাকলে শুধুই ফুল স্ক্রিন ফর্ম দেখাবে (No Sidebar & TopHeader)
    return <main className="min-h-screen w-full">{children}</main>;
  }

  // লগইন পরবর্তী সুরক্ষিত পেজগুলোতে সাইডবার ও টপ-হেডারসহ ড্যাশবোর্ড লেআউট দেখাবে
  return (
    <div className="flex min-h-screen bg-slate-50/60 font-sans antialiased">
      {/* বাম পাশের সাইডবার */}
      <Sidebar />

      {/* ডান পাশের মেইন এরিয়া */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* উপরের হেডার বার */}
        <TopHeader />

        {/* মূল পেজের কনটেন্ট */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}