import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { supplierId, amount, paymentMethod, referenceNo, note } = await request.json();

    if (!supplierId || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: "Supplier ID and valid Amount are required" },
        { status: 400 }
      );
    }

    const payAmount = Number(amount);

    // Transaction-এর মাধ্যমে পেমেন্ট সেভ ও কারেন্ট ব্যালেন্স আপডেট করা
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.supplierPayment.create({
        data: {
          storeId: currentUser.storeId,
          supplierId,
          amount: payAmount,
          paymentMethod: paymentMethod || "CASH",
          referenceNo: referenceNo ? String(referenceNo).trim() : null,
          note: note ? String(note).trim() : null,
        },
      });

      // সাপ্লাইয়ারের বকেয়া কমবে (বা অ্যাডভান্স বাড়বে)
      const updatedSupplier = await tx.supplier.update({
        where: { id: supplierId },
        data: {
          currentBalance: {
            increment: payAmount, // পেমেন্ট করলে ব্যালেন্স পজিটিভের দিকে যাবে (বকেয়া শোধ হবে)
          },
        },
      });

      return { payment, updatedSupplier };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Supplier Payment Error:", error);
    return NextResponse.json({ success: false, error: "Failed to record payment" }, { status: 500 });
  }
}