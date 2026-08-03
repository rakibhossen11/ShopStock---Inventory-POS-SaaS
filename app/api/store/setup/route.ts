import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const DEFAULT_STORE_ID = "store-id01966366745";

// ১. সার্ভার থেকে স্টোরের তথ্য নিয়ে আসা (GET)
export async function GET() {
  try {
    const store = await prisma.store.findUnique({
      where: { id: DEFAULT_STORE_ID },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, message: "No store configuration found" },
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

// ২. স্টোরের তথ্য আপডেট/সেভ করা (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, address, phone, currency } = body;

    const store = await prisma.store.upsert({
      where: { id: DEFAULT_STORE_ID },
      update: {
        name,
        address,
        phone,
        currency,
      },
      create: {
        id: DEFAULT_STORE_ID,
        name,
        address,
        phone,
        currency,
      },
    });

    return NextResponse.json({ success: true, data: store });
  } catch (error) {
    console.error("Store Setup Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to setup/update store" },
      { status: 500 }
    );
  }
}