import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ১. সারাদিনের সেল পেজ ডাটা এবং ওয়ালেট সামারি আনা (GET)
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { storeId, userId } = currentUser;

    // আজ দিনের শুরুর সময় এবং বর্তমান সময়
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // ওপেন ক্যাশ রেজিস্টার ও সিস্টেম ক্যাশ হিসাব
    const activeRegister = await prisma.cashRegister.findFirst({
      where: { storeId, userId, status: "OPEN" },
      include: { transactions: true },
    });

    let systemCash = activeRegister ? activeRegister.openingBalance : 0;
    if (activeRegister) {
      activeRegister.transactions.forEach((tx) => {
        if (tx.type === "CASH_IN" || tx.type === "PAYMENT") systemCash += tx.amount;
        if (tx.type === "CASH_OUT" || tx.type === "REFUND") systemCash -= tx.amount;
      });
    }

    // আজকের সেল পেজ থেকে এজেন্ট অর্ডারের হিসেব
    const todayAgentOrders = await prisma.mfsOrder.findMany({
      where: { storeId, createdAt: { gte: todayStart } },
    });

    let todayCashInTotal = 0;
    let todayCashOutTotal = 0;
    let todayAgentCommission = 0;

    todayAgentOrders.forEach((order) => {
      if (order.transactionType === "CASH_IN") todayCashInTotal += order.amount;
      if (order.transactionType === "CASH_OUT") todayCashOutTotal += order.amount;
      todayAgentCommission += order.commissionAmount;
    });

    // আজকের সেল পেজ থেকে পার্সোনাল ট্রানজেকশনের হিসেব
    const todayPersonalTxs = await prisma.mfsTransaction.findMany({
      where: { storeId, createdAt: { gte: todayStart } },
    });

    let todayPersonalExtraEarned = 0;
    todayPersonalTxs.forEach((tx) => {
      todayPersonalExtraEarned += tx.profitAmount;
    });

    // বর্তমান এজেন্ট এবং পার্সোনাল ওয়ালেট লিস্ট
    const agentWallets = await prisma.mFSAgentWallet.findMany({ where: { storeId } });
    const personalWallets = await prisma.mFSPersonalWallet.findMany({ where: { storeId } });

    // সর্বশেষ ডে-এন্ড ক্লোজিং রেকর্ড
    const lastClosing = await prisma.dailyClosing.findFirst({
      where: { storeId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        openingCash: activeRegister ? activeRegister.openingBalance : (lastClosing?.closingCash || 0),
        systemCalculatedCash: systemCash,
        todaySalesSummary: {
          cashInTotal: todayCashInTotal,
          cashOutTotal: todayCashOutTotal,
          agentCommission: todayAgentCommission,
          personalExtraProfit: todayPersonalExtraEarned,
          totalSellEntries: todayAgentOrders.length + todayPersonalTxs.length,
        },
        agentWallets,
        personalWallets,
        lastClosingDate: lastClosing?.closingDate || null,
      },
    });
  } catch (error) {
    console.error("Day Close Fetch Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch day-close summary" }, { status: 500 });
  }
}

// ২. ডে-এন্ড ক্লোজিং সাবমিট করা (POST)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { storeId, userId } = currentUser;
    const body = await request.json();

    const {
      openingCash,
      closingCash,
      systemCalculatedCash,
      agentWalletsInput, // Array of { id, actualBalance }
      personalWalletsInput, // Array of { id, actualBalance }
      agentCommissionEarned,
      personalExtraEarned,
      note,
    } = body;

    const actualCash = Number(closingCash) || 0;
    const startCash = Number(openingCash) || 0;

    let totalAgentBalance = 0;
    let totalPersonalBalance = 0;

    const result = await prisma.$transaction(async (tx) => {
      // ১. এজেন্ট ওয়ালেট আসল ব্যালেন্স আপডেট
      if (Array.isArray(agentWalletsInput)) {
        for (const wallet of agentWalletsInput) {
          const bal = Number(wallet.actualBalance) || 0;
          totalAgentBalance += bal;

          await tx.mFSAgentWallet.update({
            where: { id: wallet.id, storeId },
            data: { currentBalance: bal },
          });
        }
      }

      // ২. পার্সোনাল ওয়ালেট আসল ব্যালেন্স আপডেট
      if (Array.isArray(personalWalletsInput)) {
        for (const wallet of personalWalletsInput) {
          const bal = Number(wallet.actualBalance) || 0;
          totalPersonalBalance += bal;

          await tx.mFSPersonalWallet.update({
            where: { id: wallet.id, storeId },
            data: { currentBalance: bal },
          });
        }
      }

      // ৩. লাভ-ক্ষতি ও গরমিল হিসাব
      const startingAssets = startCash;
      const endingAssets = actualCash + totalAgentBalance + totalPersonalBalance;
      const discrepancy = actualCash - Number(systemCalculatedCash || 0);
      const totalProfit = Number(agentCommissionEarned || 0) + Number(personalExtraEarned || 0) + discrepancy;

      // ৪. DailyClosing টেবিল এন্ট্রি
      const closingRecord = await tx.dailyClosing.create({
        data: {
          storeId,
          openingCash: startCash,
          closingCash: actualCash,
          systemCalculatedCash: Number(systemCalculatedCash) || 0,
          agentWalletBalance: totalAgentBalance,
          agentCommissionEarned: Number(agentCommissionEarned) || 0,
          personalWalletBalance: totalPersonalBalance,
          personalExtraEarned: Number(personalExtraEarned) || 0,
          totalStartingAssets: startingAssets,
          totalEndingAssets: endingAssets,
          discrepancyAmount: discrepancy,
          netDayProfit: totalProfit,
          note: note ? String(note).trim() : null,
        },
      });

      // ৫. একটিভ শিফট বন্ধ করে সমাপনী জের সেভ
      const activeRegister = await tx.cashRegister.findFirst({
        where: { storeId, userId, status: "OPEN" },
      });

      if (activeRegister) {
        await tx.cashRegister.update({
          where: { id: activeRegister.id },
          data: {
            status: "CLOSED",
            closingBalance: actualCash,
            expectedBalance: Number(systemCalculatedCash) || 0,
            difference: discrepancy,
            closedAt: new Date(),
          },
        });
      }

      return closingRecord;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Day-end closing completed successfully!",
    });
  } catch (error) {
    console.error("Day Close Submit Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process day close" }, { status: 500 });
  }
}