import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

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

    const result = await prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: { name: storeName },
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "STORE_OWNER",
          storeId: store.id,
        },
      });

      return { store, user };
    });

    // 💡 role: result.user.role as any টাইপ কাস্ট করে দেওয়া হলো
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