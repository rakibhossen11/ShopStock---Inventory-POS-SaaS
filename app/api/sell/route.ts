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
    const { customerId, items, discount, paidAmount, paymentMethod, isQuickSell } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "Cart items are required" }, { status: 400 });
    }

    // ১. সাবটোটাল হিসাব (পরিমাণ × বিক্রয়মূল্য)
    const subTotal = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + Number(item.quantity) * Number(item.unitPrice),
      0
    );

    // ২. ডিসকাউন্ট ও গ্র্যান্ড টোটাল হিসাব
    const actualDiscount = Number(discount) || 0;
    const grandTotal = Math.max(0, subTotal - actualDiscount);
    const actualPaid = isQuickSell ? grandTotal : Number(paidAmount) || 0;
    const dueAmount = grandTotal > actualPaid ? grandTotal - actualPaid : 0;
    const changeAmount = actualPaid > grandTotal ? actualPaid - grandTotal : 0;

    // ৩. ইউনিক ইনভয়েস আইডি
    const invoiceNo = `INV-${Date.now().toString().slice(-8)}`;

    // ৪. অ্যাক্টিভ ক্যাশ রেজিস্টার চেক
    const activeRegister = await prisma.cashRegister.findFirst({
      where: {
        storeId,
        userId,
        status: "OPEN",
      },
    });

    // ৫. Prisma Transaction
    const result = await prisma.$transaction(async (tx) => {
      let totalCostOfGoods = 0;
      const saleItemsData = [];

      // ক) প্রতিটি প্রোডাক্টের কেনাদাম (costPrice) নেওয়া ও স্টক আপডেট
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const costPrice = Number(product.costPrice) || 0;
        const itemQuantity = Number(item.quantity) || 0;
        const itemUnitPrice = Number(item.unitPrice) || 0;

        totalCostOfGoods += costPrice * itemQuantity;

        saleItemsData.push({
          productId: item.productId,
          quantity: itemQuantity,
          unitPrice: itemUnitPrice,
          costPrice: costPrice, // কেনার সময়ের আসল দাম সেভ রাখা হলো
          totalPrice: itemUnitPrice * itemQuantity,
        });

        // প্রোডাক্টের স্টক মাইনাস করা
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: itemQuantity },
          },
        });
      }

      // 🎯 নিট প্রফিট হিসাব: (Grand Total) - (Total Product Cost)
      const calculatedProfit = grandTotal - totalCostOfGoods;

      // খ) SaleOrder এন্ট্রি (ডিসকাউন্ট ও প্রফিট ২-টাই সেভ করা হচ্ছে)
      const saleOrder = await tx.saleOrder.create({
        data: {
          storeId,
          customerId: customerId || null,
          invoiceNo,
          subTotal,
          discount: actualDiscount,      // 👈 ডিসকাউন্ট সেভ হলো
          grandTotal,
          profitAmount: calculatedProfit, // 👈 নিট প্রফিট সেভ হলো
          paidAmount: actualPaid - changeAmount,
          dueAmount,
          changeAmount,
          paymentMethod: paymentMethod || "CASH",
          status: "COMPLETED",
          items: {
            create: saleItemsData,
          },
        },
        include: {
          items: { include: { product: { select: { name: true } } } },
          customer: { select: { name: true, phone: true } },
        },
      });

      // গ) ক্যাশ রেজিস্টার ট্রানজেকশন এন্ট্রি
      if (activeRegister && (actualPaid - changeAmount) > 0) {
        await tx.cashTransaction.create({
          data: {
            registerId: activeRegister.id,
            type: "PAYMENT",
            amount: actualPaid - changeAmount,
            reason: `Sale ${invoiceNo}`,
          },
        });
      }

      // ঘ) কাস্টমারের বাকী আপডেট (যদি বকেয়া থাকে)
      if (customerId && dueAmount > 0) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            dueBalance: { increment: dueAmount },
          },
        });
      }

      return saleOrder;
    });

    return NextResponse.json({ 
      success: true, 
      data: result, 
      message: "Sale completed with discount and profit recorded!" 
    });
  } catch (error: any) {
    console.error("Process Sell Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to complete sale" }, { status: 500 });
  }
}