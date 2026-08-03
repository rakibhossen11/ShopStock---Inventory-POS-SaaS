import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Role } from "@prisma/client"; // 👈 Prisma থেকে Role ইম্পোর্ট করুন

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role; // 👈 এখানে কাস্টম স্ট্রিং বাদ দিয়ে সরাসরি Prisma Role বসান
  storeId: string;
  storeName?: string;
}

interface AuthState {
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch (error) {
          console.error("Logout failed:", error);
        } finally {
          set({ user: null });
          window.location.href = "/login";
        }
      },
    }),
    {
      name: "shopstock-auth-storage",
    }
  )
);