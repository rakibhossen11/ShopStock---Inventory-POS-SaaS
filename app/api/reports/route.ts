import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "this_month";

    // তারিখ রেঞ্জ ফিল্টার সেট করা
    const now = new Date();
    let startDate: Date | undefined;

    if (filter === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filter === "last_7_days") {
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
    } else if (filter === "this_month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const dateQuery = startDate ? { gte: startDate } : undefined;

    // ১. Sales Data ফেচ করা
    const salesOrders = await prisma.saleOrder.findMany({
      where: {
        storeId: currentUser.storeId,
        createdAt: dateQuery,
      },
      include: {
        items: {
          include: {
            product: { select: { costPrice: true, name: true } },
          },
        },
      },
    });

    // ২. Expenses Data ফেচ করা
    const expenses = await prisma.expense.findMany({
      where: {
        storeId: currentUser.storeId,
        createdAt: dateQuery,
      },
    });

    // ৩. Overall Product & Stock Data
    const products = await prisma.product.findMany({
      where: { storeId: currentUser.storeId },
      select: {
        id: true,
        name: true,
        costPrice: true,
        sellingPrice: true,
        stock: true,
      },
    });

    // ৪. Customer & Supplier Dues Data
    const [customers, suppliers] = await Promise.all([
      prisma.customer.aggregate({
        where: { storeId: currentUser.storeId },
        _sum: { dueBalance: true },
      }),
      prisma.supplier.aggregate({
        where: { storeId: currentUser.storeId },
        _sum: { currentBalance: true },
      }),
    ]);

    // 🧮 আর্থিক হিসাবসমূহ (Calculations)
    let totalSalesRevenue = 0;
    let totalPaidCollected = 0;
    let totalSalesDue = 0;
    let totalCOGS = 0; // Cost of Goods Sold

    salesOrders.forEach((order) => {
      totalSalesRevenue += order.grandTotal;
      totalPaidCollected += order.paidAmount;
      totalSalesDue += order.dueAmount;

      order.items.forEach((item) => {
        // মালটার ক্রয়মূল্য x বিক্রির পরিমাণ
        const costPrice = item.product?.costPrice || 0;
        totalCOGS += costPrice * item.quantity;
      });
    });

    const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const grossProfit = totalSalesRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpensesAmount;

    // ইনভেন্টরি ভ্যালুয়েশন
    const totalInventoryCost = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);
    const totalInventorySalesValue = products.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0);

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalSalesRevenue,
          totalPaidCollected,
          totalSalesDue,
          totalCOGS,
          grossProfit,
          totalExpensesAmount,
          netProfit,
          totalInventoryCost,
          totalInventorySalesValue,
          customerDuesReceivable: customers._sum.dueBalance || 0,
          supplierPayable: suppliers._sum.currentBalance || 0,
        },
        ordersCount: salesOrders.length,
      },
    });
  } catch (error) {
    console.error("Fetch Reports Error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate report" }, { status: 500 });
  }
}