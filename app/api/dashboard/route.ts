import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const storeId = currentUser.storeId;

    // লগইন করা ইউজারের বিস্তারিত ও স্টোর ডাটা ফেচ করা
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      include: { store: { select: { name: true } } },
    });

    // আজকের দিনের শুরু (Midnight Time Range)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // ১. আজকের বিক্রির হিসাব
    const todaySales = await prisma.saleOrder.findMany({
      where: {
        storeId,
        createdAt: { gte: todayStart },
      },
      select: { grandTotal: true },
    });

    const todaySalesAmount = todaySales.reduce((sum, order) => sum + order.grandTotal, 0);
    const todayOrdersCount = todaySales.length;

    // ২. রিসেন্ট ৫টি সেলস অর্ডার
    const recentSales = await prisma.saleOrder.findMany({
      where: { storeId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
      },
    });

    // ৩. স্টক ভ্যালু ও লো-স্টক আইটেমস
    const products = await prisma.product.findMany({
      where: { storeId },
      select: {
        id: true,
        name: true,
        stock: true,
        costPrice: true,
        minStockAlert: true,
      },
    });

    const stockValueCost = products.reduce(
      (sum, p) => sum + Math.max(0, p.stock) * p.costPrice,
      0
    );

    const lowStockItems = products
      .filter((p) => p.stock <= p.minStockAlert)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        reorder: p.minStockAlert,
      }));

    return NextResponse.json({
      success: true,
      data: {
        user: {
          name: user?.name || "User",
          email: user?.email || "",
          storeName: user?.store?.name || "My Store",
        },
        todaySalesAmount,
        todayOrdersCount,
        stockValueCost,
        lowStockCount: lowStockItems.length,
        lowStockItems,
        recentSales,
      },
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard metrics" },
      { status: 500 }
    );
  }
}