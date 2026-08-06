import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { storeId } = currentUser;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30days"; // "today" | "yesterday" | "7days" | "30days" | "thisMonth" | "custom"
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let startDate = new Date();
    let endDate = new Date();

    if (range === "today") {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === "yesterday") {
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === "7days") {
      startDate.setDate(endDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "30days") {
      startDate.setDate(endDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "thisMonth") {
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "custom" && startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    }

    // ১. MfsOrder (এজেন্ট সেলের কমিশন)
    const agentOrders = await prisma.mfsOrder.findMany({
      where: {
        storeId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        createdAt: true,
        commissionAmount: true,
      },
    });

    // ২. MfsTransaction (পার্সোনাল ট্রানজেকশন সার্ভিস চার্জ/প্রফিট)
    const personalTxs = await prisma.mfsTransaction.findMany({
      where: {
        storeId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        createdAt: true,
        profitAmount: true,
      },
    });

    // ৩. MfsDailyStock (স্টক পেজে ইনপুট দেওয়া সব ওয়ালেটের ডেইলি কমিশন)
    const dailyStocks = await prisma.mfsDailyStock.findMany({
      where: {
        storeId,
        entryDate: { gte: startDate, lte: endDate },
      },
      select: {
        entryDate: true,
        walletCategory: true,
        totalProfit: true,
      },
    });

    // 📊 দিনভিত্তিক (Date-Wise) ডাটা গ্রুপিং ম্যাপ
    const dailyMap: Record<string, { date: string; agentCommission: number; personalProfit: number; total: number }> = {};

    // ক) MfsOrder থেকে কমিশন যোগ
    agentOrders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split("T")[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { date: dateKey, agentCommission: 0, personalProfit: 0, total: 0 };
      }
      const amount = Number(order.commissionAmount) || 0;
      dailyMap[dateKey].agentCommission += amount;
      dailyMap[dateKey].total += amount;
    });

    // খ) MfsTransaction থেকে প্রফিট যোগ
    personalTxs.forEach((tx) => {
      const dateKey = tx.createdAt.toISOString().split("T")[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { date: dateKey, agentCommission: 0, personalProfit: 0, total: 0 };
      }
      const amount = Number(tx.profitAmount) || 0;
      dailyMap[dateKey].personalProfit += amount;
      dailyMap[dateKey].total += amount;
    });

    // গ) 🎯 MfsDailyStock থেকে সব ওয়ালেটের আনরেস্ট্রিক্টেড কমিশন যোগ (Fix Applied Here)
    dailyStocks.forEach((stock) => {
      const dateKey = stock.entryDate.toISOString().split("T")[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { date: dateKey, agentCommission: 0, personalProfit: 0, total: 0 };
      }

      const profit = Number(stock.totalProfit) || 0;

      if (stock.walletCategory === "AGENT") {
        dailyMap[dateKey].agentCommission += profit;
        dailyMap[dateKey].total += profit;
      } else {
        dailyMap[dateKey].personalProfit += profit;
        dailyMap[dateKey].total += profit;
      }
    });

    // তারিখ অনুযায়ী সাজানো (Newest First)
    const commissionHistory = Object.values(dailyMap).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const grandAgentCommission = commissionHistory.reduce((acc, curr) => acc + curr.agentCommission, 0);
    const grandPersonalProfit = commissionHistory.reduce((acc, curr) => acc + curr.personalProfit, 0);
    const grandTotalIncome = grandAgentCommission + grandPersonalProfit;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalAgentCommission: grandAgentCommission,
          totalPersonalProfit: grandPersonalProfit,
          grandTotalIncome,
        },
        history: commissionHistory,
      },
    });
  } catch (error) {
    console.error("Commission History API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch commission history" }, { status: 500 });
  }
}