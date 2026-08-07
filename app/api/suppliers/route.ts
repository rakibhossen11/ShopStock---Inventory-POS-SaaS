import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ১. স্টোরের সব সাপ্লাইয়ারদের লিস্ট ফেচ করা (GET)
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const suppliers = await prisma.supplier.findMany({
      where: { storeId: currentUser.storeId },
      include: {
        _count: {
          select: { purchaseOrders: true, payments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: suppliers });
  } catch (error) {
    console.error("Fetch Suppliers Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch suppliers" }, { status: 500 });
  }
}

// ২. নতুন সাপ্লাইয়ার তৈরি করা অথবা সাপ্লাইয়ার পেমেন্ট গ্রহণ/অ্যাডজাস্ট করা (POST)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { storeId, userId } = currentUser;
    const body = await request.json();

    // 🎯 কেস A: সাপ্লাইয়ারকে পেমেন্ট দেওয়া (Due Payment Settlement)
    if (body.action === "PAYMENT" || body.supplierId) {
      const { supplierId, amount, paymentMethod, note } = body;
      const payAmount = Number(amount);

      if (!supplierId || !payAmount || payAmount <= 0) {
        return NextResponse.json(
          { success: false, error: "Supplier ID and valid amount are required" },
          { status: 400 }
        );
      }

      const activeRegister = await prisma.cashRegister.findFirst({
        where: { storeId, userId, status: "OPEN" },
      });

      const result = await prisma.$transaction(async (tx) => {
        // ১) SupplierPayment রেকর্ড তৈরি
        const paymentRecord = await tx.supplierPayment.create({
          data: {
            storeId,
            supplierId,
            amount: payAmount,
            paymentMethod: paymentMethod || "CASH",
            note: note ? String(note).trim() : "Due Payment to Supplier",
          },
        });

        // 🎯 ২) সাপ্লাইয়ারের কারেন্ট ব্যালেন্স থেকে বকেয়া কমানো (সঠিক সমন্বয়)
        await tx.supplier.update({
          where: { id: supplierId, storeId },
          data: {
            currentBalance: { decrement: payAmount },
          },
        });

        // 🎯 ৩) PURCHASES PAGE-এর বকেয়া কমানো (FIFO পদ্ধতি)
        const pendingPurchases = await tx.purchaseOrder.findMany({
          where: {
            storeId,
            supplierId,
            dueAmount: { gt: 0 },
          },
          orderBy: { createdAt: "asc" },
        });

        let remainingPayAmount = payAmount;

        for (const purchase of pendingPurchases) {
          if (remainingPayAmount <= 0) break;

          const currentDue = Number(purchase.dueAmount) || 0;

          if (remainingPayAmount >= currentDue) {
            await tx.purchaseOrder.update({
              where: { id: purchase.id },
              data: {
                paidAmount: { increment: currentDue },
                dueAmount: 0,
              },
            });
            remainingPayAmount -= currentDue;
          } else {
            await tx.purchaseOrder.update({
              where: { id: purchase.id },
              data: {
                paidAmount: { increment: remainingPayAmount },
                dueAmount: { decrement: remainingPayAmount },
              },
            });
            remainingPayAmount = 0;
          }
        }

        // ৪) ক্যাশ রেজিস্টার থেকে ক্যাশ আউট
        if (activeRegister && (paymentMethod === "CASH" || !paymentMethod)) {
          await tx.cashTransaction.create({
            data: {
              registerId: activeRegister.id,
              type: "CASH_OUT",
              amount: payAmount,
              reason: `Supplier Due Payment (${supplierId})`,
            },
          });
        }

        return paymentRecord;
      });

      return NextResponse.json({
        success: true,
        data: result,
        message: "Supplier payment recorded and Purchases due updated successfully!",
      });
    }

    // 🎯 কেস B: নতুন সাপ্লাইয়ার তৈরি করা (Create New Supplier)
    const { name, contactPerson, email, phone, address, openingBalance } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: "Supplier Name and Phone are required" },
        { status: 400 }
      );
    }

    const initialBalance = Number(openingBalance) || 0;

    const newSupplier = await prisma.supplier.create({
      data: {
        storeId,
        name: String(name).trim(),
        contactPerson: contactPerson ? String(contactPerson).trim() : null,
        email: email ? String(email).trim() : null,
        phone: String(phone).trim(),
        address: address ? String(address).trim() : null,
        openingBalance: initialBalance,
        currentBalance: initialBalance,
      },
    });

    return NextResponse.json({ success: true, data: newSupplier });
  } catch (error: any) {
    console.error("Supplier POST Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to process request" }, { status: 500 });
  }
}

// ৩. সাপ্লাইয়ার ডিলিট করা (DELETE)
export async function DELETE(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Supplier ID is required" }, { status: 400 });
    }

    await prisma.supplier.delete({
      where: {
        id,
        storeId: currentUser.storeId,
      },
    });

    return NextResponse.json({ success: true, message: "Supplier deleted successfully" });
  } catch (error) {
    console.error("Delete Supplier Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete supplier" }, { status: 500 });
  }
}