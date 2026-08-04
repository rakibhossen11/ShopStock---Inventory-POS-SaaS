import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ১. স্টোরের সব প্রোডাক্ট ফেচ করা (GET)
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: { storeId: currentUser.storeId },
      include: {
        category: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error("Fetch Products Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
  }
}

// ২. নতুন প্রোডাক্ট তৈরি করা (POST)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { name, categoryId, sku, barcode, costPrice, sellingPrice, stock, minStockAlert, unit, description } = await request.json();

    if (!name || sellingPrice === undefined) {
      return NextResponse.json({ success: false, error: "Product name and Selling Price are required" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        storeId: currentUser.storeId,
        name: String(name).trim(),
        categoryId: categoryId || null,
        sku: sku ? String(sku).trim() : null,
        barcode: barcode ? String(barcode).trim() : null,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        stock: Number(stock) || 0,
        minStockAlert: minStockAlert !== undefined ? Number(minStockAlert) : 5,
        unit: unit || "PCS",
        description: description ? String(description).trim() : null,
      },
      include: {
        category: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Create Product Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 });
  }
}

// ৩. প্রোডাক্ট ডিলিট করা (DELETE)
export async function DELETE(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id, storeId: currentUser.storeId },
    });

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete Product Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 500 });
  }
}