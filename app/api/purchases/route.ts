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

    const { storeId, userId } = currentUser;
    const body = await request.json();

    const { 
      supplierId, 
      invoiceNo, 
      paidAmount, 
      paymentMethod, 
      note, 
      items 
    } = body;

    if (!supplierId || !invoiceNo || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Supplier, Invoice No, and Items are required" },
        { status: 400 }
      );
    }

    const totalAmount = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
      0
    );

    const actualPaid = Number(paidAmount) || 0;
    const dueAmount = Math.max(0, totalAmount - actualPaid);
    const formattedInvoiceNo = String(invoiceNo).trim();

    const activeRegister = await prisma.cashRegister.findFirst({
      where: { storeId, userId, status: "OPEN" },
    });

    const result = await prisma.$transaction(async (tx) => {
      // ১. পারচেজ অর্ডার তৈরি
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          storeId,
          supplierId,
          invoiceNo: formattedInvoiceNo,
          totalAmount,
          paidAmount: actualPaid,
          dueAmount,
          note: note ? String(note).trim() : null,
          status: "RECEIVED",
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

      // ২. স্টক বৃদ্ধি ও ক্রয়মূল্য আপডেট
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: Number(item.quantity) },
            costPrice: Number(item.unitPrice),
          },
        });
      }

      // ৩. SupplierPayment টেবিলে পেমেন্ট রেকর্ড তৈরি
      if (actualPaid > 0) {
        await tx.supplierPayment.create({
          data: {
            storeId,
            supplierId,
            amount: actualPaid,
            paymentMethod: paymentMethod || "CASH",
            referenceNo: formattedInvoiceNo,
            note: `Purchase Order Payment (${formattedInvoiceNo})`,
          },
        });
      }

      // ৪. ক্যাশ আউট
      if (activeRegister && (paymentMethod === "CASH" || !paymentMethod) && actualPaid > 0) {
        await tx.cashTransaction.create({
          data: {
            registerId: activeRegister.id,
            type: "CASH_OUT",
            amount: actualPaid,
            reason: `Purchase Payment (${formattedInvoiceNo})`,
          },
        });
      }

      // 🎯 ৫. সাপ্লাইয়ারের বকেয়া প্লাস করা (Due যোগ হবে)
      if (dueAmount > 0) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: {
            currentBalance: { increment: dueAmount },
          },
        });
      }

      return purchaseOrder;
    });

    return NextResponse.json({ 
      success: true, 
      data: result,
      message: "Purchase completed and payment recorded in history!"
    });
  } catch (error: any) {
    console.error("Create Purchase Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create purchase order" }, { status: 500 });
  }
}