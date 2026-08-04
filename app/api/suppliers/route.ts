import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ১. স্টোরের সব সাপ্লাইয়ারদের লিস্ট ফেচ করা (GET)
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

// ২. নতুন সাপ্লাইয়ার তৈরি করা (POST)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { name, contactPerson, email, phone, address, openingBalance } = await request.json();

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: "Supplier Name and Phone are required" },
        { status: 400 }
      );
    }

    const initialBalance = Number(openingBalance) || 0;

    const newSupplier = await prisma.supplier.create({
      data: {
        storeId: currentUser.storeId,
        name: String(name).trim(),
        contactPerson: contactPerson ? String(contactPerson).trim() : null,
        email: email ? String(email).trim() : null,
        phone: String(phone).trim(),
        address: address ? String(address).trim() : null,
        openingBalance: initialBalance,
        currentBalance: initialBalance, // শুরুর ব্যালেন্সই কারেন্ট ব্যালেন্স
      },
    });

    return NextResponse.json({ success: true, data: newSupplier });
  } catch (error) {
    console.error("Create Supplier Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create supplier" }, { status: 500 });
  }
}

// ৩. সাপ্লাইয়ার ডিলিট করা (DELETE)
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