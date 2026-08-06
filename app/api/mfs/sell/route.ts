import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { storeId, userId } = currentUser;
    const body = await request.json();

    const { 
      walletCategory, // "AGENT" | "PERSONAL"
      agentWalletId, 
      personalWalletId, 
      transactionType, // "CASH_IN" | "CASH_OUT" | "PERSONAL_RECEIVED" | "PERSONAL_SEND"
      amount, 
      extraAmount, // পার্সোনাল রিসিভের সময় বাড়তি লাভ
      costAmount,  // পার্সোনাল সেন্ডের সময় সার্ভিস ফি
      customerPhone, 
      referenceTrxId, 
      note 
    } = body;

    const txAmount = Number(amount) || 0;
    if (txAmount <= 0) {
      return NextResponse.json({ success: false, error: "Valid Amount is required" }, { status: 400 });
    }

    // একটিভ ক্যাশ রেজিস্টার চেক
    const activeRegister = await prisma.cashRegister.findFirst({
      where: { storeId, userId, status: "OPEN" },
    });

    // ------------------------------------------------------------------
    // A. AGENT WALLET TRANSACTIONS (Cash In / Cash Out)
    // ------------------------------------------------------------------
    if (walletCategory === "AGENT") {
      if (!agentWalletId) {
        return NextResponse.json({ success: false, error: "Agent Wallet ID required" }, { status: 400 });
      }

      const wallet = await prisma.mFSAgentWallet.findUnique({
        where: { id: agentWalletId, storeId },
      });

      if (!wallet) {
        return NextResponse.json({ success: false, error: "Agent Wallet not found" }, { status: 404 });
      }

      // কমিশন গণনা
      let commission = 0;
      if (transactionType === "CASH_IN") {
        commission = wallet.commissionType === "PERCENTAGE"
          ? (txAmount * wallet.cashInCommission) / 100
          : (txAmount / 1000) * wallet.cashInCommission;
      } else if (transactionType === "CASH_OUT") {
        commission = wallet.commissionType === "PERCENTAGE"
          ? (txAmount * wallet.cashOutCommission) / 100
          : (txAmount / 1000) * wallet.cashOutCommission;
      }

      let netWalletImpact = 0;
      let netCashImpact = 0;

      if (transactionType === "CASH_IN") {
        if (wallet.currentBalance < txAmount) {
          return NextResponse.json({ success: false, error: "Insufficient Wallet Balance for Cash In" }, { status: 400 });
        }
        netCashImpact = txAmount;
        netWalletImpact = -txAmount + commission;
      } else if (transactionType === "CASH_OUT") {
        netCashImpact = -txAmount;
        netWalletImpact = txAmount + commission;
      } else {
        return NextResponse.json({ success: false, error: "Invalid Transaction Type for Agent Wallet" }, { status: 400 });
      }

      const result = await prisma.$transaction(async (tx) => {
        // ওয়ালেট ব্যালেন্স আপডেট (Store Isolation নিশ্চিত করা হয়েছে)
        const updatedWallet = await tx.mFSAgentWallet.update({
          where: { id: agentWalletId, storeId },
          data: { currentBalance: { increment: netWalletImpact } },
        });

        // ক্যাশ ট্রানজেকশন এন্ট্রি
        if (activeRegister) {
          await tx.cashTransaction.create({
            data: {
              registerId: activeRegister.id,
              type: transactionType === "CASH_IN" ? "CASH_IN" : "CASH_OUT",
              amount: txAmount,
              reason: `Agent ${transactionType} (${wallet.providerName} - ${customerPhone || "N/A"})`,
            },
          });
        }

        // MFS Order তৈরি
        const order = await tx.mfsOrder.create({
          data: {
            storeId,
            agentWalletId,
            transactionType: transactionType as any,
            customerPhone: customerPhone ? String(customerPhone).trim() : null,
            amount: txAmount,
            commissionAmount: commission,
            netCashImpact,
            netWalletImpact,
            referenceTrxId: referenceTrxId ? String(referenceTrxId).trim() : null,
            note: note ? String(note).trim() : null,
          },
        });

        return { updatedWallet, order };
      });

      return NextResponse.json({
        success: true,
        data: result,
        message: `Agent ${transactionType} processed successfully! Commission: ৳${commission.toFixed(2)}`,
      });
    }

    // ------------------------------------------------------------------
    // B. PERSONAL WALLET TRANSACTIONS (Received / Send)
    // ------------------------------------------------------------------
    if (walletCategory === "PERSONAL") {
      if (!personalWalletId) {
        return NextResponse.json({ success: false, error: "Personal Wallet ID required" }, { status: 400 });
      }

      const wallet = await prisma.mFSPersonalWallet.findUnique({
        where: { id: personalWalletId, storeId },
      });

      if (!wallet) {
        return NextResponse.json({ success: false, error: "Personal Wallet not found" }, { status: 404 });
      }

      const extra = Number(extraAmount) || 0; 
      const cost = Number(costAmount) || 0;   

      let netCashImpact = 0;
      let netWalletImpact = 0;

      if (transactionType === "PERSONAL_RECEIVED") {
        netCashImpact = -txAmount;
        netWalletImpact = txAmount + extra;
      } else if (transactionType === "PERSONAL_SEND") {
        const totalDeduction = txAmount + cost;
        if (wallet.currentBalance < totalDeduction) {
          return NextResponse.json({ success: false, error: "Insufficient Personal Wallet Balance (Amount + Fee)" }, { status: 400 });
        }
        netCashImpact = txAmount;
        netWalletImpact = -totalDeduction;
      } else {
        return NextResponse.json({ success: false, error: "Invalid Transaction Type for Personal Wallet" }, { status: 400 });
      }

      const result = await prisma.$transaction(async (tx) => {
        // পার্সোনাল ওয়ালেট আপডেট
        const updatedWallet = await tx.mFSPersonalWallet.update({
          where: { id: personalWalletId, storeId },
          data: { currentBalance: { increment: netWalletImpact } },
        });

        // ক্যাশ ট্রানজেকশন এন্ট্রি
        if (activeRegister) {
          await tx.cashTransaction.create({
            data: {
              registerId: activeRegister.id,
              type: transactionType === "PERSONAL_RECEIVED" ? "CASH_OUT" : "CASH_IN",
              amount: txAmount,
              reason: `Personal MFS ${transactionType} (${wallet.providerName})`,
            },
          });
        }

        // পার্সোনাল ট্রানজেকশন এন্ট্রি
        const transaction = await tx.mfsTransaction.create({
          data: {
            storeId,
            personalWalletId,
            type: transactionType === "PERSONAL_RECEIVED" ? "BUY_EMONEY" : "SELL_EMONEY",
            cashAmount: txAmount,
            walletAmount: Math.abs(netWalletImpact),
            profitAmount: extra > 0 ? extra : 0,
            referenceNo: referenceTrxId ? String(referenceTrxId).trim() : null,
            note: note ? String(note).trim() : null,
          },
        });

        return { updatedWallet, transaction };
      });

      return NextResponse.json({
        success: true,
        data: result,
        message: `Personal MFS ${transactionType === "PERSONAL_RECEIVED" ? "E-Money Received" : "E-Money Send"} processed successfully!`,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid Wallet Category" }, { status: 400 });
  } catch (error) {
    console.error("MFS Terminal Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process transaction" }, { status: 500 });
  }
}