This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# 🛒 ShopStock - Inventory & POS SaaS Platform

**ShopStock** হলো একটি আধুনিক, স্কেলেবল এবং ফুল-স্ট্যাক SaaS (Software as a Service) ভিত্তিক **Point of Sale (POS)** এবং **Inventory Management System**। এটি ছোট ও মাঝারি দোকানদারদের (Retail Shops) ব্যবসায়িক কার্যক্রম, স্টক কন্ট্রোল এবং কর্মী (Staff) ম্যানেজমেন্টকে সহজ করার লক্ষ্যে তৈরি করা হচ্ছে।

---

## 🚀 বর্তমানে সম্পন্নকৃত ফিচারসমূহ (Completed Features)

### 🔑 ১. সিকিউর অথেন্টিকেশন সিস্টেম (Authentication System)
- **Store Owner Registration:** নতুন স্টোর ওপেনিং এর সাথে ওনার অ্যাকাউন্ট তৈরির সুবিধা।
- **Multi-Role Login System:** ইমেইল ও পাসওয়ার্ড ভিত্তিক নিরাপদ লগইন।
- **Password Hashing:** `bcryptjs` ব্যবহার করে সুরক্ষিত পাসওয়ার্ড সংরক্ষণ।
- **JWT & HTTP-Only Cookies:** সিকিউর ৭-দিনের সেশন ম্যানেজমেন্ট।
- **Protected Routes (Middleware):** আন-অথোরাইজড ইউজারের জন্য স্বয়ংক্রিয়ভাবে `/login` রিডাইরেক্ট এবং অর্গানিক রুট সুরক্ষা।

### 🏬 ২. ডাইনামিক স্টোর সেটিংস (Store Management)
- **Single/Multi Store Architecture:** প্রতিটি স্টোরের নিজস্ব আইডেন্টিটি (`storeId`) আইসোলেশন।
- **Manage Store Profile:** পোস্টগ্রেস ডাটাবেজ (PostgreSQL) থেকে সরাসরি স্টোরের নাম, ঠিকানা, ফোন নম্বর ও বেস কারেন্সি (BDT, USD, SAR) দেখা ও সরাসরি আপডেট করার সুবিধা।

### 🎨 ৩. আধুনিক ইউজার ইন্টারফেস ও লেআউট (UI & Layout)
- **Dynamic Dashboard Layout:** ইউজারের লগইন স্ট্যাটাস ও রুটের ওপর ভিত্তি করে ক্লায়েন্ট-সাইড স্মার্ট লেআউট কন্ট্রোল।
- **Auth Page Isolation:** `/login` এবং `/register` পেজে সাইডবার ও অপ্রয়োজনীয় নেভিগেশন স্বয়ংক্রিয়ভাবে হাইড (Hide) রাখার লজিক।
- **Collapsible Sidebar:** ডাইনামিক ড্রপডাউন সাব-মেনু (Sell, MFS & Recharge, Settings ইত্যাদি) সহ রেসপন্সিভ সাইডবার।
- **User Profile Widget:** সাইডবারে লগইন করা ইউজারের নাম, রোল এবং এক-ক্লিকে সাইন আউট করার কুইক বাটন।

---

## 🛠️ প্রযুক্তি ও স্ট্যাক (Tech Stack Used)

- **Framework:** [Next.js 14/15 (App Router)](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database ORM:** [Prisma v7](https://www.prisma.io/)
- **Database Engine:** [PostgreSQL](https://www.postgresql.org/)
- **Driver Adapter:** `@prisma/adapter-pg` & `pg`
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) (with LocalStorage Persistence)
- **Authentication:** Custom JWT (`jsonwebtoken`) & `bcryptjs`
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## 🗄️ ডাটাবেজ মডেলিং (Prisma Schema Overview)

বর্তমানে ডাটাবেজে নিচের মডিউলগুলো সেটআপ ও কানেক্টেড রয়েছে:

```prisma
enum Role {
  STORE_OWNER
  MANAGER
  CASHIER
}

model Store {
  id        String   @id @default(cuid())
  name      String
  address   String?
  phone     String?
  currency  String   @default("BDT")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users     User[]
}

model User {
  id        String   @id @default(cuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  name      String
  email     String   @unique
  password  String
  role      Role     @default(CASHIER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
