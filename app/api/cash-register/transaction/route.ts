import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { registerId, type, amount, reason } = await request.json();

    if (!registerId || !type || !amount) {
      return NextResponse.json({ success: false, error: "Invalid transaction data" }, { status: 400 });
    }

    const transaction = await prisma.cashTransaction.create({
      data: {
        registerId,
        type, // CASH_IN or CASH_OUT
        amount: Number(amount),
        reason,
      },
    });

    return NextResponse.json({ success: true, data: transaction });
  } catch (error) {
    console.error("Cash Transaction Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process transaction" }, { status: 500 });
  }
}