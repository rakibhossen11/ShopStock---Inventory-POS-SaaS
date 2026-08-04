import { create } from "zustand";

export interface Transaction {
  id: string;
  type: "CASH_IN" | "CASH_OUT" | "PAYMENT" | "REFUND";
  amount: number;
  reason?: string;
  createdAt: string;
}

export interface CashRegister {
  id: string;
  openingBalance: number;
  closingBalance?: number;
  expectedBalance?: number;
  difference?: number;
  status: "OPEN" | "CLOSED";
  openedAt: string;
  closedAt?: string;
  note?: string;
  transactions: Transaction[];
}

interface RegisterState {
  currentRegister: CashRegister | null;
  loading: boolean;
  fetchCurrentRegister: () => Promise<void>;
  openRegister: (openingBalance: number, note?: string) => Promise<boolean>;
  closeRegister: (closingBalance: number, note?: string) => Promise<boolean>;
  addTransaction: (type: "CASH_IN" | "CASH_OUT", amount: number, reason: string) => Promise<boolean>;
}

export const useCashRegisterStore = create<RegisterState>((set, get) => ({
  currentRegister: null,
  loading: false,

  fetchCurrentRegister: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/cash-register");
      const data = await res.json();
      if (data.success) {
        set({ currentRegister: data.data });
      }
    } catch (error) {
      console.error("Error fetching register:", error);
    } finally {
      set({ loading: false });
    }
  },

  openRegister: async (openingBalance, note) => {
    try {
      const res = await fetch("/api/cash-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openingBalance, note }),
      });
      const data = await res.json();
      if (data.success) {
        set({ currentRegister: data.data });
        return true;
      }
      alert(data.error || "Failed to open register");
      return false;
    } catch (error) {
      console.error("Error opening register:", error);
      return false;
    }
  },

  closeRegister: async (closingBalance, note) => {
    const { currentRegister } = get();
    if (!currentRegister) return false;

    try {
      const res = await fetch("/api/cash-register", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registerId: currentRegister.id,
          closingBalance,
          note,
        }),
      });
      const data = await res.json();
      if (data.success) {
        set({ currentRegister: null });
        return true;
      }
      alert(data.error || "Failed to close register");
      return false;
    } catch (error) {
      console.error("Error closing register:", error);
      return false;
    }
  },

  addTransaction: async (type, amount, reason) => {
    const { currentRegister, fetchCurrentRegister } = get();
    if (!currentRegister) return false;

    try {
      const res = await fetch("/api/cash-register/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registerId: currentRegister.id,
          type,
          amount,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCurrentRegister(); // রিয়েল-টাইমে ব্যালেন্স আপডেট
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error adding transaction:", error);
      return false;
    }
  },
}));