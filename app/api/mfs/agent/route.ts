import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ডিফল্ট ৫টি এজেন্ট ক্যাটাগরি
const DEFAULT_CATEGORIES = [
  { name: "Cash In", type: "CASH_IN" },
  { name: "Cash Out", type: "CASH_OUT" },
  { name: "Pay Bill", type: "PAY_BILL" },
  { name: "B2B Send", type: "B2B_SEND" },
  { name: "B2B Received", type: "B2B_RECEIVED" },
];

// ১. ওয়ালেট ও ক্যাটাগরি ফেচ করা (GET)
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const storeId = currentUser.storeId;

    // চেক করা ক্যাটাগরি অলরেডি আছে কিনা, না থাকলে ৫টি অটো-ক্রিয়েট হবে
    let categories = await prisma.mfsCategory.findMany({
      where: { storeId },
    });

    if (categories.length === 0) {
      await prisma.mfsCategory.createMany({
        data: DEFAULT_CATEGORIES.map((cat) => ({
          storeId,
          name: cat.name,
          type: cat.type as any,
        })),
      });

      categories = await prisma.mfsCategory.findMany({ where: { storeId } });
    }

    // ওয়ালেট লিস্ট ফেচ
    const wallets = await prisma.mFSAgentWallet.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: { wallets, categories },
    });
  } catch (error) {
    console.error("Fetch MFS Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch MFS data" }, { status: 500 });
  }
}

// ২. নতুন MFS Agent Wallet তৈরি করা (POST)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const {
      providerName,
      accountNumber,
      accountType,
      openingBalance,
      cashInCommission,
      cashOutCommission,
    } = await request.json();

    if (!providerName || !accountNumber) {
      return NextResponse.json(
        { success: false, error: "Provider Name and Account Number are required" },
        { status: 400 }
      );
    }

    const initialBalance = Number(openingBalance) || 0;

    const wallet = await prisma.mFSAgentWallet.create({
      data: {
        storeId: currentUser.storeId,
        providerName: String(providerName).trim(),
        accountNumber: String(accountNumber).trim(),
        accountType: accountType || "AGENT",
        openingBalance: initialBalance,
        currentBalance: initialBalance, // ইনিশিয়াল থাকলে তা দিয়ে কারেন্ট ব্যালেন্স শুরু হবে
        cashInCommission: Number(cashInCommission) || 0,
        cashOutCommission: Number(cashOutCommission) || 0,
      },
    });

    return NextResponse.json({ success: true, data: wallet });
  } catch (error) {
    console.error("Create MFS Wallet Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create MFS Wallet" }, { status: 500 });
  }
}

// ৩. স্টক পেজের মতো ওয়ালেট ব্যালেন্স ও ডিটেইলস আপডেট করা (PUT)
export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id, currentBalance, cashInCommission, cashOutCommission, accountNumber, accountType } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: "Wallet ID is required" }, { status: 400 });
    }

    const updatedWallet = await prisma.mFSAgentWallet.update({
      where: { id, storeId: currentUser.storeId },
      data: {
        accountNumber: accountNumber ? String(accountNumber).trim() : undefined,
        accountType: accountType || undefined,
        currentBalance: currentBalance !== undefined ? Number(currentBalance) : undefined,
        cashInCommission: cashInCommission !== undefined ? Number(cashInCommission) : undefined,
        cashOutCommission: cashOutCommission !== undefined ? Number(cashOutCommission) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updatedWallet });
  } catch (error) {
    console.error("Update MFS Wallet Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update MFS Wallet" }, { status: 500 });
  }
}