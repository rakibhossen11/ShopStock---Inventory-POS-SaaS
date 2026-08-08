import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ১. স্টোরের সব কাস্টমার ফেচ করা (GET)
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const customers = await prisma.customer.findMany({
      where: { storeId: currentUser.storeId },
      include: {
        _count: { select: { payments: true, saleOrders: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: customers });
  } catch (error) {
    console.error("Fetch Customers Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch customers" }, { status: 500 });
  }
}

// ২. নতুন কাস্টমার তৈরি অথবা বকেয়া কালেকশন জমা নেওয়া (POST)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { storeId, userId } = currentUser;
    const body = await request.json();

    // 🎯 কাস্টমার থেকে টাকা কালেকশন (বকেয়া পরিশোধ কিংবা অ্যাডভান্স জমা)
    if (body.action === "COLLECT_DUE" || body.customerId) {
      const { customerId, amount, paymentMethod, referenceNo, note } = body;
      const payAmount = Number(amount);

      if (!customerId || !payAmount || payAmount <= 0) {
        return NextResponse.json(
          { success: false, error: "Customer ID and valid amount are required" },
          { status: 400 }
        );
      }

      // ওপেন ক্যাশ রেজিস্টার চেক
      const activeRegister = await prisma.cashRegister.findFirst({
        where: { storeId, userId, status: "OPEN" },
      });

      const result = await prisma.$transaction(async (tx) => {
        // ১) CustomerPayment রেকর্ড তৈরি
        const paymentRecord = await tx.customerPayment.create({
          data: {
            storeId,
            customerId,
            amount: payAmount,
            paymentMethod: paymentMethod || "CASH",
            referenceNo: referenceNo ? String(referenceNo).trim() : null,
            note: note ? String(note).trim() : "Customer Payment Received",
          },
        });

        // 🎯 ২) কাস্টমারের dueBalance কমানো (টাকা বেশি দিলে অটোমেটিক Advance হয়ে যাবে)
        await tx.customer.update({
          where: { id: customerId, storeId },
          data: {
            dueBalance: { decrement: payAmount },
          },
        });

        // ৩) কাস্টমারের পুরানো বকেয়া ইনভয়েসগুলোর (SaleOrder) dueAmount কমানো (FIFO)
        const pendingSales = await tx.saleOrder.findMany({
          where: {
            storeId,
            customerId,
            dueAmount: { gt: 0 },
          },
          orderBy: { createdAt: "asc" },
        });

        let remainingAmount = payAmount;

        for (const sale of pendingSales) {
          if (remainingAmount <= 0) break;

          const currentDue = Number(sale.dueAmount) || 0;

          if (remainingAmount >= currentDue) {
            await tx.saleOrder.update({
              where: { id: sale.id },
              data: {
                paidAmount: { increment: currentDue },
                dueAmount: 0,
              },
            });
            remainingAmount -= currentDue;
          } else {
            await tx.saleOrder.update({
              where: { id: sale.id },
              data: {
                paidAmount: { increment: remainingAmount },
                dueAmount: { decrement: remainingAmount },
              },
            });
            remainingAmount = 0;
          }
        }

        // ৪) ক্যাশ রেজিস্টারে টাকা ইন হওয়া (CASH_IN)
        if (activeRegister && (paymentMethod === "CASH" || !paymentMethod)) {
          await tx.cashTransaction.create({
            data: {
              registerId: activeRegister.id,
              type: "CASH_IN",
              amount: payAmount,
              reason: `Customer Payment (${customerId})`,
            },
          });
        }

        return paymentRecord;
      });

      return NextResponse.json({
        success: true,
        data: result,
        message: "Payment recorded successfully!",
      });
    }

    // 🎯 নতুন কাস্টমার তৈরি
    const { name, phone, email, address, openingDue } = body;

    if (!name || !phone) {
      return NextResponse.json({ success: false, error: "Customer Name and Phone are required" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        storeId,
        name: String(name).trim(),
        phone: String(phone).trim(),
        email: email ? String(email).trim() : null,
        address: address ? String(address).trim() : null,
        dueBalance: Number(openingDue) || 0, // ধনাত্মক হলে Due, ঋণাত্মক দিলে Advance
      },
    });

    return NextResponse.json({ success: true, data: customer });
  } catch (error: any) {
    console.error("Customer Process Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to process customer request" }, { status: 500 });
  }
}

// ৩. কাস্টমার ডিলিট করা (DELETE)
export async function DELETE(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Customer ID is required" }, { status: 400 });
    }

    await prisma.customer.delete({
      where: { id, storeId: currentUser.storeId },
    });

    return NextResponse.json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Delete Customer Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete customer" }, { status: 500 });
  }
}