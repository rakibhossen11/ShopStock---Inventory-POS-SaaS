import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ১. সকল সেলস অর্ডার এবং সেগুলোর অর্জিত প্রফিট সঠিকভাবে ফেচ করা (GET)
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { storeId } = currentUser;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "all";

    let dateFilter = {};
    if (range === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { gte: today } };
    }

    const sales = await prisma.saleOrder.findMany({
      where: { 
        storeId,
        ...dateFilter
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        invoiceNo: true,
        subTotal: true,
        discount: true,
        grandTotal: true,
        profitAmount: true, // 👈 নিশ্চিতভাবে প্রফিটের ফিল্ড যুক্ত করা হলো
        paidAmount: true,
        dueAmount: true,
        paymentMethod: true,
        createdAt: true,
        customer: { 
          select: { name: true, phone: true } 
        },
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            costPrice: true,
            totalPrice: true,
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

// ২. নতুন সেলস তৈরি করা ও সঠিক প্রোডাক্ট প্রফিট সেভ করা (POST)
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

    // ১. ইনভয়েস নম্বর ও সাধারণ অংক
    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
    const totalSub = Number(subTotal) || 0;
    const totalDiscount = Number(discount) || 0;
    const totalGrand = Number(grandTotal) || (totalSub - totalDiscount);
    const totalPaid = Number(paidAmount) || 0;
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

        const costPrice = Number(product.costPrice) || 0;
        const itemQuantity = Number(item.quantity) || 0;
        const itemUnitPrice = Number(item.unitPrice) || 0;

        const itemTotalCost = costPrice * itemQuantity;
        totalCostOfGoods += itemTotalCost;

        saleItemsData.push({
          productId: item.productId,
          quantity: itemQuantity,
          unitPrice: itemUnitPrice,
          costPrice: costPrice, // বিক্রয়ের সময়কার আসল কেনাদাম
          totalPrice: itemUnitPrice * itemQuantity,
        });

        // প্রোডাক্ট স্টক আপডেট
        await tx.product.update({
          where: { id: item.productId, storeId },
          data: { stock: { decrement: itemQuantity } },
        });
      }

      // 🎯 নিট প্রফিট হিসাব = (Grand Total) - (Total Product Cost)
      const calculatedProfit = totalGrand - totalCostOfGoods;

      // ৩. SaleOrder তৈরি
      const saleOrder = await tx.saleOrder.create({
        data: {
          storeId,
          customerId: customerId || null,
          invoiceNo,
          subTotal: totalSub,
          discount: totalDiscount,
          grandTotal: totalGrand,
          profitAmount: calculatedProfit, // 👈 নির্ভুল প্রফিট সেভ
          paidAmount: totalPaid,
          dueAmount,
          paymentMethod: paymentMethod || "CASH",
          status: "COMPLETED",
          items: {
            create: saleItemsData,
          },
        },
      });

      // ৪. কাস্টমার বকেয়া খাতা আপডেট (যদি বকেয়া থাকে)
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