import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ১. স্টক অ্যাডজাস্টমেন্টের হিস্ট্রি দেখা (GET)
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const adjustments = await prisma.stockAdjustment.findMany({
      where: { storeId: currentUser.storeId },
      include: {
        items: {
          include: {
            product: { select: { name: true, unit: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: adjustments });
  } catch (error) {
    console.error("Fetch Stock Adjustments Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch stock adjustments" }, { status: 500 });
  }
}

// ২. নতুন স্টক অ্যাডজাস্টমেন্ট সাবমিট করা (POST)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { reason, items } = await request.json();

    if (!reason || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Reason and Adjustment items are required" },
        { status: 400 }
      );
    }

    // Atomic Transaction: অ্যাডজাস্টমেন্ট সেভ + প্রোডাক্টের স্টক আপডেট
    const result = await prisma.$transaction(async (tx) => {
      const adjustment = await tx.stockAdjustment.create({
        data: {
          storeId: currentUser.storeId,
          reason: String(reason).trim(),
          items: {
            create: items.map((item: { productId: string; type: "ADD" | "SUBTRACT"; quantity: number }) => ({
              productId: item.productId,
              type: item.type,
              quantity: Number(item.quantity),
            })),
          },
        },
        include: { items: true },
      });

      // প্রোডাক্ট স্টক আপডেট
      for (const item of items) {
        const qty = Number(item.quantity);
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: item.type === "ADD" ? { increment: qty } : { decrement: qty },
          },
        });
      }

      return adjustment;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Create Stock Adjustment Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process stock adjustment" }, { status: 500 });
  }
}