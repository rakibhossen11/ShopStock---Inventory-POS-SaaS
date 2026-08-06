import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ১. সকল সেলস অর্ডার এবং সেগুলোর অর্জিত প্রফিট ফেচ করা (GET)
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sales = await prisma.saleOrder.findMany({
      where: { storeId: currentUser.storeId },
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, phone: true } },
        items: {
          include: {
            product: { select: { name: true, unit: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: sales });
  } catch (error) {
    console.error("Sales Fetch Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch sales" }, { status: 500 });
  }
}

// ২. নতুন প্রোডাক্ট সেলস করার সাথে সাথে প্রফিট হিসেব করে সেভ করা (POST)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { storeId } = currentUser;
    const body = await request.json();

    const {
      customerId,
      items, // Array of { productId, quantity, unitPrice }
      subTotal,
      discount,
      grandTotal,
      paidAmount,
      paymentMethod,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: "Items are required" }, { status: 400 });
    }

    // ১. ইউনিক ইনভয়েস নম্বর তৈরি
    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
    const totalPaid = Number(paidAmount) || 0;
    const totalGrand = Number(grandTotal) || 0;
    const totalDiscount = Number(discount) || 0;
    const dueAmount = Math.max(0, totalGrand - totalPaid);

    const result = await prisma.$transaction(async (tx) => {
      let totalCostOfGoods = 0;
      const saleItemsData = [];

      // ২. প্রতিটি আইটেমের প্রোডাক্ট কেনাদাম (Cost Price) ফেচ করা এবং স্টক মাইনাস করা
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId, storeId },
        });

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const costPrice = product.costPrice || 0;
        const itemTotalCost = costPrice * item.quantity;
        totalCostOfGoods += itemTotalCost;

        saleItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          costPrice: costPrice, // কেনার সময়কার আসল দাম
          totalPrice: Number(item.unitPrice) * item.quantity,
        });

        // প্রোডাক্ট স্টক আপডেট
        await tx.product.update({
          where: { id: item.productId, storeId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 🎯 নিট প্রফিট হিসাব = (Grand Total) - (Total Product Cost)
      const calculatedProfit = totalGrand - totalCostOfGoods;

      // ৩. SaleOrder ক্রিয়েট করা
      const saleOrder = await tx.saleOrder.create({
        data: {
          storeId,
          customerId: customerId || null,
          invoiceNo,
          subTotal: Number(subTotal),
          discount: totalDiscount,
          grandTotal: totalGrand,
          profitAmount: calculatedProfit, // 👈 প্রফিট সেভ হলো
          paidAmount: totalPaid,
          dueAmount,
          paymentMethod: paymentMethod || "CASH",
          status: "COMPLETED",
          items: {
            create: saleItemsData,
          },
        },
      });

      // ৪. কাস্টমার বকেয়া খাতা আপডেট (যদি বকেয়া থাকে)
      if (dueAmount > 0 && customerId) {
        await tx.customer.update({
          where: { id: customerId, storeId },
          data: { dueBalance: { increment: dueAmount } },
        });
      }

      return saleOrder;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Sale completed and profit recorded successfully!",
    });
  } catch (error: any) {
    console.error("Sale Process Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to process sale" }, { status: 500 });
  }
}