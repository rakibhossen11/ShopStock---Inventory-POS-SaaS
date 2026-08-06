import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ১. এজেন্ট ও পার্সোনাল ওয়ালেট এবং ফিল্টারড স্টক হিস্ট্রি ফেচ করা (GET)
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { storeId } = currentUser;
    const { searchParams } = new URL(request.url);
    
    const range = searchParams.get("range") || "7days"; // "7days" | "30days" | "custom"
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let dateFilter: any = {};
    const now = new Date();

    if (range === "7days") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      dateFilter = { gte: sevenDaysAgo };
    } else if (range === "30days") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      dateFilter = { gte: thirtyDaysAgo };
    } else if (range === "custom" && startDateParam && endDateParam) {
      const start = new Date(startDateParam);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999);
      dateFilter = { gte: start, lte: end };
    }

    // ওয়ালেট লিস্ট ফেচ
    const agentWallets = await prisma.mFSAgentWallet.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      include: {
        dailyStocks: {
          take: 1,
          orderBy: { entryDate: "desc" },
        },
      },
    });

    const personalWallets = await prisma.mFSPersonalWallet.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      include: {
        dailyStocks: {
          take: 1,
          orderBy: { entryDate: "desc" },
        },
      },
    });

    // তারিখ অনুযায়ী ফিল্টার করে স্টক হিস্ট্রি আনা
    const stockHistory = await prisma.mfsDailyStock.findMany({
      where: { 
        storeId,
        ...(Object.keys(dateFilter).length > 0 ? { entryDate: dateFilter } : {}),
      },
      orderBy: { entryDate: "desc" },
      include: {
        agentWallet: {
          select: {
            providerName: true,
            accountNumber: true,
          },
        },
        personalWallet: {
          select: {
            providerName: true,
            accountNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        agentWallets,
        personalWallets,
        history: stockHistory,
      },
    });
  } catch (error) {
    console.error("MFS Stock Fetch Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch stock data" }, { status: 500 });
  }
}

// ২. এজেন্ট / পার্সোনাল ডে-এন্ড স্টক এন্ট্রি সেভ করা (POST)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { storeId } = currentUser;
    const body = await request.json();

    const {
      walletCategory,
      agentWalletId,
      personalWalletId,
      entryDate,
      totalIn,
      totalOut,
      totalProfit,
      endingBalance,
      note,
    } = body;

    if (endingBalance === undefined || !walletCategory) {
      return NextResponse.json(
        { success: false, error: "Wallet category and Ending Balance are required" },
        { status: 400 }
      );
    }

    const recordDate = entryDate ? new Date(entryDate) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      const stockEntry = await tx.mfsDailyStock.create({
        data: {
          storeId,
          walletCategory,
          agentWalletId: walletCategory === "AGENT" ? agentWalletId : null,
          personalWalletId: walletCategory === "PERSONAL" ? personalWalletId : null,
          entryDate: recordDate,
          totalIn: Number(totalIn) || 0,
          totalOut: Number(totalOut) || 0,
          totalProfit: Number(totalProfit) || 0,
          endingBalance: Number(endingBalance) || 0,
          note: note ? String(note).trim() : null,
        },
      });

      if (walletCategory === "AGENT" && agentWalletId) {
        await tx.mFSAgentWallet.update({
          where: { id: agentWalletId, storeId },
          data: { currentBalance: Number(endingBalance) || 0 },
        });
      } else if (walletCategory === "PERSONAL" && personalWalletId) {
        await tx.mFSPersonalWallet.update({
          where: { id: personalWalletId, storeId },
          data: { currentBalance: Number(endingBalance) || 0 },
        });
      }

      return stockEntry;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `${walletCategory === "AGENT" ? "Agent" : "Personal"} daily stock entry saved successfully!`,
    });
  } catch (error) {
    console.error("MFS Stock Save Error:", error);
    return NextResponse.json({ success: false, error: "Failed to save daily stock entry" }, { status: 500 });
  }
}