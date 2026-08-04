// Human-Readable Store ID তৈরি করার ফাংশন (যেমন: STORE-8392)
export function generateStoreId(storeName: string): string {
  const prefix = storeName
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 4)
    .toUpperCase() || "SHOP";

  const randomNumber = Math.floor(1000 + Math.random() * 9000); // ৪ সংখ্যার ইউনিক নম্বর
  return `${prefix}-${randomNumber}`;
}

// Store ID সহ Combined Staff Code জেনারেট করা (যেমন: rakib009emp002)
export function generateStaffCode(storeId: string, totalStaffCount: number): string {
  const nextNum = totalStaffCount + 1;
  const paddedNum = String(nextNum).padStart(3, "0"); // 3 digit format: 001, 002...
  
  return `${storeId.toLowerCase()}emp${paddedNum}`;
}
