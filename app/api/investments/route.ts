import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ১. ইনভেস্টমেন্ট ও ঋণের সব ট্রানজেকশন ফেচ করা (GET)
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const transactions = await prisma.capitalTransaction.findMany({
      where: { storeId: currentUser.storeId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: transactions });
  } catch (error: any) {
    console.error("Fetch Investments Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch investments" }, { status: 500 });
  }
}

// ২. নতুন ইনভেস্টমেন্ট / উত্তোলন / লোন এন্ট্রি দেওয়া (POST)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { storeId, userId } = currentUser;
    const body = await request.json();

    const { type, amount, sourceOrPerson, paymentMethod, note } = body;
    const numAmount = Number(amount);

    if (!type || !numAmount || numAmount <= 0) {
      return NextResponse.json({ success: false, error: "Valid type and amount are required" }, { status: 400 });
    }

    // একটিভ ক্যাশ রেজিস্টার চেক করা (যদি ক্যাশে লেনদেন হয়)
    const activeRegister = await prisma.cashRegister.findFirst({
      where: { storeId, userId, status: "OPEN" },
    });

    const result = await prisma.$transaction(async (tx) => {
      // ১) CapitalTransaction রেকর্ড সেভ করা
      const transaction = await tx.capitalTransaction.create({
        data: {
          storeId,
          registerId: activeRegister?.id || null,
          type, // CAPITAL_IN | DRAWING_OUT | LOAN_TAKEN | LOAN_REPAID
          amount: numAmount,
          sourceOrPerson: sourceOrPerson ? String(sourceOrPerson).trim() : "Store Owner",
          paymentMethod: paymentMethod || "CASH",
          note: note ? String(note).trim() : null,
        },
      });

      // ২) ক্যাশ লেনদেন হলে CashTransaction এন্ট্রি দেওয়া (ক্যাশ ইন/আউট)
      if (activeRegister && (paymentMethod === "CASH" || !paymentMethod)) {
        if (type === "CAPITAL_IN" || type === "LOAN_TAKEN") {
          // ড্রয়ারে ক্যাশ টাকা বাড়লো
          await tx.cashTransaction.create({
            data: {
              registerId: activeRegister.id,
              type: "CASH_IN",
              amount: numAmount,
              reason: `Capital/Loan Received: ${sourceOrPerson || "Owner Investment"}`,
            },
          });
        } else if (type === "DRAWING_OUT" || type === "LOAN_REPAID") {
          // ড্রয়ার থেকে ক্যাশ টাকা কমলো
          await tx.cashTransaction.create({
            data: {
              registerId: activeRegister.id,
              type: "CASH_OUT",
              amount: numAmount,
              reason: `Owner Drawing/Loan Repaid: ${sourceOrPerson || "Withdrawal"}`,
            },
          });
        }
      }

      return transaction;
    });

    return NextResponse.json({ 
      success: true, 
      data: result, 
      message: "Investment transaction recorded successfully!" 
    });
  } catch (error: any) {
    console.error("Create Investment Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to record transaction" }, { status: 500 });
  }
}