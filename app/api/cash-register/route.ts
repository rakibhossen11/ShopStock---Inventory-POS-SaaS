import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ১. কারেন্ট এক্টিভ শিফট এবং রিয়েল-টাইম রেকর্ড ফেচ করা (GET)
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // এই মুহূর্তে রানিং বা ওপেন থাকা শিফট বের করা
    const activeRegister = await prisma.cashRegister.findFirst({
      where: {
        storeId: currentUser.storeId,
        userId: currentUser.userId,
        status: "OPEN",
      },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" }, // সাম্প্রতিক ট্রানজেকশনগুলো আগে দেখাবে
        },
        user: {
          select: { name: true, staffCode: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: activeRegister });
  } catch (error) {
    console.error("Fetch Register Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch register data" },
      { status: 500 }
    );
  }
}

// ২. নতুন শিফট ওপেন করা (POST)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { openingBalance, note } = await request.json();

    // চেক করা অলরেডি কোনো ওপেন শিফট আছে কি না
    const existingOpenShift = await prisma.cashRegister.findFirst({
      where: {
        storeId: currentUser.storeId,
        userId: currentUser.userId,
        status: "OPEN",
      },
    });

    if (existingOpenShift) {
      return NextResponse.json(
        { success: false, error: "You already have an active register shift open" },
        { status: 400 }
      );
    }

    const newRegister = await prisma.cashRegister.create({
      data: {
        storeId: currentUser.storeId,
        userId: currentUser.userId,
        openingBalance: Number(openingBalance) || 0,
        note: note ? String(note).trim() : null,
        status: "OPEN",
      },
      include: {
        transactions: true,
        user: {
          select: { name: true, staffCode: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: newRegister });
  } catch (error) {
    console.error("Open Register Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to open register" },
      { status: 500 }
    );
  }
}

// ৩. শিফট ক্লোজ করা এবং গরমিল (Difference) হিসাব করা (PUT)
export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { registerId, closingBalance, note } = await request.json();

    if (!registerId) {
      return NextResponse.json(
        { success: false, error: "Register ID is required" },
        { status: 400 }
      );
    }

    const register = await prisma.cashRegister.findUnique({
      where: { id: registerId },
      include: { transactions: true },
    });

    if (!register || register.status === "CLOSED") {
      return NextResponse.json(
        { success: false, error: "Register shift not found or already closed" },
        { status: 400 }
      );
    }

    // সিস্টেমে এক্সপেক্টেড ব্যালেন্স হিসাব করা
    // Expected = Opening Balance + Total Cash In - Total Cash Out
    const totalCashIn = register.transactions
      .filter((t) => t.type === "CASH_IN" || t.type === "PAYMENT")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalCashOut = register.transactions
      .filter((t) => t.type === "CASH_OUT" || t.type === "REFUND")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const expectedBalance = Number(register.openingBalance || 0) + totalCashIn - totalCashOut;
    const actualClosing = Number(closingBalance) || 0;
    const difference = actualClosing - expectedBalance; // গরমিল (+ বেশি বা - কম)

    const closedRegister = await prisma.cashRegister.update({
      where: { id: registerId },
      data: {
        closingBalance: actualClosing,
        expectedBalance,
        difference,
        status: "CLOSED",
        closedAt: new Date(),
        note: note ? String(note).trim() : register.note,
      },
      include: {
        transactions: true,
      },
    });

    return NextResponse.json({ success: true, data: closedRegister });
  } catch (error) {
    console.error("Close Register Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to close register" },
      { status: 500 }
    );
  }
}