import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ১. শুধুমাত্র Personal Wallets ফেচ করা (GET)
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const wallets = await prisma.mFSPersonalWallet.findMany({
      where: { storeId: currentUser.storeId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: wallets });
  } catch (error) {
    console.error("Fetch Personal Wallets Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch personal wallets" }, { status: 500 });
  }
}

// ২. নতুন Personal Wallet তৈরি করা (POST)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { providerName, accountNumber, openingBalance } = body;

    if (!providerName || !accountNumber) {
      return NextResponse.json(
        { success: false, error: "Provider Name and Account Number are required" },
        { status: 400 }
      );
    }

    const initialBalance = Number(openingBalance) || 0;

    const wallet = await prisma.mFSPersonalWallet.create({
      data: {
        storeId: currentUser.storeId,
        providerName: String(providerName).trim(),
        accountNumber: String(accountNumber).trim(),
        accountType: "PERSONAL",
        openingBalance: initialBalance,
        currentBalance: initialBalance,
      },
    });

    return NextResponse.json({ success: true, data: wallet });
  } catch (error) {
    console.error("Create Personal Wallet Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create personal wallet" }, { status: 500 });
  }
}

// ৩. যেকোনো পার্সোনাল ওয়ালেটের তথ্য ও রানিং ব্যালেন্স আপডেট করা (PUT)
export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, currentBalance, providerName, accountNumber } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Wallet ID is required" }, { status: 400 });
    }

    const updatedWallet = await prisma.mFSPersonalWallet.update({
      where: { id, storeId: currentUser.storeId },
      data: {
        providerName: providerName ? String(providerName).trim() : undefined,
        accountNumber: accountNumber ? String(accountNumber).trim() : undefined,
        currentBalance: currentBalance !== undefined ? Number(currentBalance) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updatedWallet });
  } catch (error) {
    console.error("Update Personal Wallet Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update personal wallet" }, { status: 500 });
  }
}