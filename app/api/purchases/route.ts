import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ১. স্টোরের সব পারচেজ হিস্ট্রি দেখা (GET)
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const purchases = await prisma.purchaseOrder.findMany({
      where: { storeId: currentUser.storeId },
      include: {
        supplier: { select: { name: true, phone: true } },
        items: {
          include: { product: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: purchases });
  } catch (error) {
    console.error("Fetch Purchases Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch purchases" }, { status: 500 });
  }
}

// ২. নতুন পারচেজ এন্ট্রি দেওয়া (POST)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { supplierId, invoiceNo, paidAmount, note, items } = await request.json();

    if (!supplierId || !invoiceNo || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Supplier, Invoice No, and Items are required" },
        { status: 400 }
      );
    }

    // মোট পারচেজ অ্যামাউন্ট হিসাব
    const totalAmount = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
      0
    );

    const actualPaid = Number(paidAmount) || 0;
    const dueAmount = totalAmount - actualPaid;

    // Prisma Transaction-এ সবকিছু একসাথে আপডেট করা
    const result = await prisma.$transaction(async (tx) => {
      // ১. পারচেজ অর্ডার তৈরি
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          storeId: currentUser.storeId,
          supplierId,
          invoiceNo: String(invoiceNo).trim(),
          totalAmount,
          paidAmount: actualPaid,
          dueAmount,
          note: note ? String(note).trim() : null,
          items: {
            create: items.map((item: { productId: string; quantity: number; unitPrice: number }) => ({
              productId: item.productId,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.quantity) * Number(item.unitPrice),
            })),
          },
        },
        include: { items: true },
      });

      // ২. স্টক বৃদ্ধি ও ক্রয়মূল্য আপডেট
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: Number(item.quantity) }, // স্টক প্লাস
            costPrice: Number(item.unitPrice), // লেটেস্ট ক্রয়মূল্য সেভ
          },
        });
      }

      // ৩. সাপ্লাইয়ার বকেয়া হিসাব
      if (dueAmount > 0) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: {
            currentBalance: { decrement: dueAmount }, // বকেয়া মাইনাসের দিকে যাবে
          },
        });
      }

      return purchaseOrder;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Create Purchase Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create purchase order" }, { status: 500 });
  }
}