import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { generateStoreId, generateStaffCode } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { name, email, password, storeName } = await request.json();

    if (!name || !email || !password || !storeName) {
      return NextResponse.json(
        { success: false, error: "Please fill all required fields" },
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

    const hashedPassword = await bcrypt.hash(password, 10);

    // 💡 Human-Readable Store ID (e.g., rakib009) & Owner Staff Code (e.g., rakib009emp001)
    const humanStoreId = generateStoreId(storeName);
    const ownerStaffCode = generateStaffCode(humanStoreId, 0);

    const result = await prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          id: humanStoreId,
          name: storeName,
        },
      });

      const user = await tx.user.create({
        data: {
          staffCode: ownerStaffCode,
          name,
          email,
          password: hashedPassword,
          role: "STORE_OWNER",
          storeId: store.id,
        },
      });

      return { store, user };
    });

    const token = signToken({
      userId: result.user.id,
      storeId: result.store.id,
      role: result.user.role as any,
      name: result.user.name,
      email: result.user.email,
    });

    const response = NextResponse.json({
      success: true,
      message: "Owner account and store created successfully",
      user: {
        id: result.user.id,
        staffCode: (result.user as any).staffCode, // 👈 as any টাইপ কাস্ট করে দেওয়া হলো
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        storeId: result.store.id,
        storeName: result.store.name,
      },
    });

    response.cookies.set("shopstock_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { success: false, error: "Registration failed" },
      { status: 500 }
    );
  }
}