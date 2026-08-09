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
    const range = searchParams.get("range") || "DAILY"; // "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM"
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let startDate = new Date();
    let endDate = new Date();

    // ডেট ফিল্টার লজিক
    if (range === "DAILY") {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === "WEEKLY") {
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "MONTHLY") {
      startDate.setDate(1); // মাসের ১ম দিন
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "CUSTOM" && startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    }

    const dateFilter = {
      storeId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // ১. বিক্রয় ও মোট প্রফিট হিসাব (SaleOrders)
    const salesSummary = await prisma.saleOrder.aggregate({
      where: { ...dateFilter, status: "COMPLETED" },
      _sum: {
        grandTotal: true,
        profitAmount: true,
        paidAmount: true,
        dueAmount: true,
      },
      _count: { id: true },
    });

    // ২. মোট খরচ (Expenses)
    const expenseSummary = await prisma.expense.aggregate({
      where: dateFilter,
      _sum: { amount: true },
    });

    // ৩. ক্যাটাগরি অনুযায়ী খরচের ব্রেকডাউন (Highest Expenses)
    const expensesByCategory = await prisma.expense.groupBy({
      by: ["categoryId"],
      where: dateFilter,
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    });

    // ক্যাটাগরির নাম যুক্ত করা
    const categoryIds = expensesByCategory.map((e) => e.categoryId).filter(Boolean) as string[];
    const categories = await prisma.expenseCategory.findMany({
      where: { id: { in: categoryIds } },
    });

    const formattedCategoryExpenses = expensesByCategory.map((exp) => {
      const cat = categories.find((c) => c.id === exp.categoryId);
      return {
        categoryName: cat ? cat.name : "Uncategorized",
        amount: exp._sum.amount || 0,
      };
    });

    // ৪. MFS ও রিচার্জ প্রফিট
    const mfsOrders = await prisma.mfsOrder.aggregate({
      where: dateFilter,
      _sum: { commissionAmount: true },
    });

    const rechargePurchases = await prisma.rechargePurchase.aggregate({
      where: dateFilter,
      _sum: { commission: true },
    });

    // চূড়ান্ত গ্র্যান্ড ফাইনান্সিয়াল হিসাব
    const totalSales = salesSummary._sum.grandTotal || 0;
    const totalPosProfit = salesSummary._sum.profitAmount || 0;
    const totalMfsProfit = mfsOrders._sum.commissionAmount || 0;
    const totalRechargeProfit = rechargePurchases._sum.commission || 0;
    
    const grossProfit = totalPosProfit + totalMfsProfit + totalRechargeProfit;
    const totalExpenses = expenseSummary._sum.amount || 0;
    const netProfitOrLoss = grossProfit - totalExpenses; // প্রফিট না লস

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalSales,
          totalSalesCount: salesSummary._count.id || 0,
          cashCollected: salesSummary._sum.paidAmount || 0,
          totalDueGiven: salesSummary._sum.dueAmount || 0,
          grossProfit,
          posProfit: totalPosProfit,
          mfsProfit: totalMfsProfit,
          rechargeProfit: totalRechargeProfit,
          totalExpenses,
          netProfitOrLoss,
          isProfit: netProfitOrLoss >= 0,
        },
        categoryExpenses: formattedCategoryExpenses,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error("Fetch Reports Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to generate report" }, { status: 500 });
  }
}