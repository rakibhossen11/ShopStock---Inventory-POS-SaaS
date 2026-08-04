import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ১. কারেন্ট ইউজারের স্টোরের তথ্য নিয়ে আসা (GET)
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const store = await prisma.store.findUnique({
      where: { id: currentUser.storeId },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, error: "Store not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: store });
  } catch (error) {
    console.error("Fetch Store Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch store details" },
      { status: 500 }
    );
  }
}

// ২. স্টোরের তথ্য আপডেট করা (POST)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "STORE_OWNER") {
      return NextResponse.json(
        { success: false, error: "Only Store Owner can update store details" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, address, phone, currency } = body;

    const store = await prisma.store.update({
      where: { id: currentUser.storeId },
      data: {
        name,
        address,
        phone,
        currency,
      },
    });

    return NextResponse.json({ success: true, data: store });
  } catch (error) {
    console.error("Store Update Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update store" },
      { status: 500 }
    );
  }
}