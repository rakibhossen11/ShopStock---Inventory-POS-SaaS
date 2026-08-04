import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { customerId, items, discount, paidAmount, paymentMethod, isQuickSell } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "Cart items are required" }, { status: 400 });
    }

    // ১. হিসাব-নিকাশ
    const subTotal = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + Number(item.quantity) * Number(item.unitPrice),
      0
    );

    const actualDiscount = Number(discount) || 0;
    const grandTotal = subTotal - actualDiscount;
    const actualPaid = isQuickSell ? grandTotal : Number(paidAmount) || 0;
    const dueAmount = grandTotal > actualPaid ? grandTotal - actualPaid : 0;
    const changeAmount = actualPaid > grandTotal ? actualPaid - grandTotal : 0;

    // ২. ইউনিক ইনভয়েস আইডি জেনারেট (e.g. INV-1722748192)
    const invoiceNo = `INV-${Date.now().toString().slice(-8)}`;

    // ৩. এক্টিভ ক্যাশ রেজিস্টার চেক
    const activeRegister = await prisma.cashRegister.findFirst({
      where: {
        storeId: currentUser.storeId,
        userId: currentUser.userId,
        status: "OPEN",
      },
    });

    // ৪. Prisma Transaction
    const result = await prisma.$transaction(async (tx) => {
      // ক) সেলস অর্ডার তৈরি
      const saleOrder = await tx.saleOrder.create({
        data: {
          storeId: currentUser.storeId,
          customerId: customerId || null,
          invoiceNo,
          subTotal,
          discount: actualDiscount,
          grandTotal,
          paidAmount: actualPaid - changeAmount,
          dueAmount,
          changeAmount,
          paymentMethod: paymentMethod || "CASH",
          status: "COMPLETED",
          items: {
            create: items.map((item: { productId: string; quantity: number; unitPrice: number }) => ({
              productId: item.productId,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.quantity) * Number(item.unitPrice),
            })),
          },
        },
        include: {
          items: { include: { product: { select: { name: true } } } },
          customer: { select: { name: true, phone: true } },
        },
      });

      // খ) ইনভেন্টরি স্টক মাইনাস
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: Number(item.quantity) },
          },
        });
      }

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

      // ঘ) কাস্টমারের বাকী আপডেট (যদি থাকে)
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

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Process Sell Error:", error);
    return NextResponse.json({ success: false, error: "Failed to complete sale" }, { status: 500 });
  }
}