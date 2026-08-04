import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sales = await prisma.saleOrder.findMany({
      where: { storeId: currentUser.storeId },
      include: {
        customer: { select: { name: true, phone: true } },
        items: {
          include: {
            product: { select: { name: true, unit: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: sales });
  } catch (error) {
    console.error("Fetch Sales Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch sales records" }, { status: 500 });
  }
}