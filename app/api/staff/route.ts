import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { generateStaffCode } from "@/lib/utils";

// ১. স্টোরের সব স্টাফদের ব্যাকএন্ড থেকে নিয়ে আসা (GET)
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const staffMembers = await prisma.user.findMany({
      where: { storeId: currentUser.storeId },
      select: {
        id: true,
        staffCode: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: staffMembers });
  } catch (error) {
    console.error("Fetch Staff Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch staff" }, { status: 500 });
  }
}

// ২. নতুন স্টাফ তৈরি করা (POST)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "STORE_OWNER") {
      return NextResponse.json(
        { success: false, error: "Only Store Owner can add staff members" },
        { status: 403 }
      );
    }

    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email is already registered" },
        { status: 400 }
      );
    }

    // 💡 এই স্টোরের বর্তমান মোট স্টাফ সংখ্যা গণনা করে নতুন কম্বাইন্ড আইডি তৈরি (e.g. rakib009emp002)
    const currentStaffCount = await prisma.user.count({
      where: { storeId: currentUser.storeId },
    });
    const humanStaffCode = generateStaffCode(currentUser.storeId, currentStaffCount);

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = await prisma.user.create({
      data: {
        staffCode: humanStaffCode,
        name,
        email,
        password: hashedPassword,
        role,
        storeId: currentUser.storeId,
      },
      select: {
        id: true,
        staffCode: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: newStaff });
  } catch (error) {
    console.error("Add Staff Error:", error);
    return NextResponse.json({ success: false, error: "Failed to add staff" }, { status: 500 });
  }
}

// ৩. স্টাফ অ্যাকাউন্ট মুছে ফেলা (DELETE)
export async function DELETE(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "STORE_OWNER") {
      return NextResponse.json(
        { success: false, error: "Only Store Owner can remove staff" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("id");

    if (!staffId) {
      return NextResponse.json({ success: false, error: "Staff ID is required" }, { status: 400 });
    }

    if (staffId === currentUser.userId) {
      return NextResponse.json(
        { success: false, error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: {
        id: staffId,
        storeId: currentUser.storeId,
      },
    });

    return NextResponse.json({ success: true, message: "Staff removed successfully" });
  } catch (error) {
    console.error("Delete Staff Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete staff" }, { status: 500 });
  }
}