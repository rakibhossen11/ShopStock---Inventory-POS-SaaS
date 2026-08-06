import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ১. রিচার্জ সিমস, পারচেজ হিস্ট্রি ও ডেইলি হিস্ট্রি ট্র্যাকিং (GET)
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { storeId } = currentUser;
    const { searchParams } = new URL(request.url);
    const selectedSimId = searchParams.get("simId");

    // সব সিম এর সাথে তাদের সর্বশেষ ১টি দিনশেষের রেকর্ড
    const sims = await prisma.rechargeSim.findMany({
      where: { storeId },
      orderBy: { operatorName: "asc" },
      include: {
        dailyBalances: { take: 1, orderBy: { entryDate: "desc" } }
      }
    });

    // স্টক কেনাকাটার রিসেন্ট হিস্ট্রি (Last 50)
    const purchases = await prisma.rechargePurchase.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      include: { sim: true },
      take: 50
    });

    // কাস্টম সিম ব্যালেন্স হিস্ট্রি (৭ দিন বা নির্দিষ্ট টাইমলাইন ব্যাক দেখার জন্য)
    const historyLogs = await prisma.rechargeDailyBalance.findMany({
      where: { 
        storeId,
        ...(selectedSimId ? { simId: selectedSimId } : {})
      },
      orderBy: { entryDate: "desc" },
      include: { sim: true },
      take: 60
    });

    return NextResponse.json({
      success: true,
      data: { sims, purchases, historyLogs }
    });
  } catch (error) {
    console.error("Recharge GET Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch recharge data" }, { status: 500 });
  }
}

// ২. অ্যাকশন প্রসেসিং (POST)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { storeId } = currentUser;
    const body = await request.json();
    const { action, operatorName, simNumber, simId, amount, commission, endingBalance, entryDate, note } = body;

    // ক) নতুন ফ্লেক্সি সিম যুক্ত করা
    if (action === "ADD_SIM") {
      const sim = await prisma.rechargeSim.create({
        data: {
          storeId,
          operatorName,
          simNumber: String(simNumber).trim(),
          currentBalance: Number(amount) || 0
        }
      });
      return NextResponse.json({ success: true, message: "SIM added successfully!", data: sim });
    }

    // খ) রিচার্জ স্টক/লাফা ব্যালেন্স কেনা
    if (action === "PURCHASE") {
      const pAmount = Number(amount) || 0;
      const pComm = Number(commission) || 0;
      const totalRec = pAmount + pComm;

      const result = await prisma.$transaction(async (tx) => {
        const purchase = await tx.rechargePurchase.create({
          data: {
            storeId,
            simId,
            amount: pAmount,
            commission: pComm,
            totalReceived: totalRec,
            note: note ? String(note).trim() : null
          }
        });

        // ওয়ালেটের রানিং ব্যালেন্স বৃদ্ধি
        await tx.rechargeSim.update({
          where: { id: simId, storeId },
          data: { currentBalance: { increment: totalRec } }
        });

        return purchase;
      });

      return NextResponse.json({ success: true, message: "Recharge balance purchased & SIM updated!", data: result });
    }

    // গ) দিনশেষের সিমে থাকা আসল ব্যালেন্স সেভ রাখা
    if (action === "DAY_END_BALANCE") {
      const sim = await prisma.rechargeSim.findUnique({ where: { id: simId, storeId } });
      if (!sim) return NextResponse.json({ success: false, error: "SIM not found" }, { status: 404 });

      const eBal = Number(endingBalance) || 0;
      // সারাদিনের অটো রিচার্জ সেল হিসাব = (বর্তমান রানিং ব্যালেন্স - রাতের শেষ ব্যালেন্স)
      const calculatedSell = Math.max(0, sim.currentBalance - eBal);
      const recordDate = entryDate ? new Date(entryDate) : new Date();

      const result = await prisma.$transaction(async (tx) => {
        const dailyEntry = await tx.rechargeDailyBalance.create({
          data: {
            storeId,
            simId,
            entryDate: recordDate,
            endingBalance: eBal,
            calculatedSell,
            note: note ? String(note).trim() : null
          }
        });

        // পরের দিনের শুরুর ব্যালেন্স হিসেবে লাইভ ব্যালেন্স আপডেট
        await tx.rechargeSim.update({
          where: { id: simId, storeId },
          data: { currentBalance: eBal }
        });

        return dailyEntry;
      });

      return NextResponse.json({ success: true, message: "Day-end balance recorded successfully!", data: result });
    }

    return NextResponse.json({ success: false, error: "Invalid Action" }, { status: 400 });
  } catch (error) {
    console.error("Recharge POST Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process transaction" }, { status: 500 });
  }
}