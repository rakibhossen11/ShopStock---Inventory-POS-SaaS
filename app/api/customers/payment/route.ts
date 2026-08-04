import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { customerId, amount, paymentMethod, referenceNo, note } = await request.json();

    if (!customerId || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: "Customer ID and valid amount are required" },
        { status: 400 }
      );
    }

    const payAmount = Number(amount);

    // Atomic Transaction: পেমেন্ট কালেকশন সেভ + কাস্টমারের বাকী কমানো
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.customerPayment.create({
        data: {
          storeId: currentUser.storeId,
          customerId,
          amount: payAmount,
          paymentMethod: paymentMethod || "CASH",
          referenceNo: referenceNo ? String(referenceNo).trim() : null,
          note: note ? String(note).trim() : null,
        },
      });

      // কাস্টমারের বাকী (dueBalance) মাইনাস হবে
      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: {
          dueBalance: { decrement: payAmount },
        },
      });

      return { payment, updatedCustomer };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Customer Payment Error:", error);
    return NextResponse.json({ success: false, error: "Failed to record customer payment" }, { status: 500 });
  }
}