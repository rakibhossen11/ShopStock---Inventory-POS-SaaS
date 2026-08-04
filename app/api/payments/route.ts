import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ১. পেমেন্ট ও খরচের ওভারভিউ সামারি ফেচ করা (GET)
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [customerPayments, supplierPayments, expenses] = await Promise.all([
      prisma.customerPayment.findMany({
        where: { storeId: currentUser.storeId },
        include: { customer: { select: { name: true, phone: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.supplierPayment.findMany({
        where: { storeId: currentUser.storeId },
        include: { supplier: { select: { name: true, phone: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.expense.findMany({
        where: { storeId: currentUser.storeId },
        include: { category: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        customerPayments,
        supplierPayments,
        expenses,
      },
    });
  } catch (error) {
    console.error("Fetch Payments Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch payment records" }, { status: 500 });
  }
}

// ২. নতুন শপ এক্সপ্রেস বা খরচ রেকর্ড করা (POST)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { title, amount, categoryId, paymentMethod, referenceNo, note } = await request.json();

    if (!title || !amount || Number(amount) <= 0) {
      return NextResponse.json({ success: false, error: "Title and valid amount are required" }, { status: 400 });
    }

    const expenseAmount = Number(amount);

    // active cash register চেক
    const activeRegister = await prisma.cashRegister.findFirst({
      where: { storeId: currentUser.storeId, userId: currentUser.userId, status: "OPEN" },
    });

    const result = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          storeId: currentUser.storeId,
          title: String(title).trim(),
          amount: expenseAmount,
          categoryId: categoryId || null,
          paymentMethod: paymentMethod || "CASH",
          referenceNo: referenceNo ? String(referenceNo).trim() : null,
          note: note ? String(note).trim() : null,
        },
      });

      if (activeRegister && paymentMethod === "CASH") {
        await tx.cashTransaction.create({
          data: {
            registerId: activeRegister.id,
            type: "CASH_OUT",
            amount: expenseAmount,
            reason: `Expense: ${title}`,
          },
        });
      }

      return expense;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Create Expense Error:", error);
    return NextResponse.json({ success: false, error: "Failed to record expense" }, { status: 500 });
  }
}