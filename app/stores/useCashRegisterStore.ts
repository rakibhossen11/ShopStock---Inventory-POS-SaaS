import { create } from "zustand";

export interface Transaction {
  id: string;
  type: "CASH_IN" | "CASH_OUT" | "PAYMENT" | "REFUND";
  amount: number;
  reason?: string;
  createdAt: string;
}

export interface ShiftSummary {
  totalSales: number;
  cashFromSales: number;
  dueGiven: number;
  totalPurchasesPaid: number;
  customerCollections: number;
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
  shiftSummary?: ShiftSummary;
}

interface RegisterState {
  currentRegister: CashRegister | null;
  previousClosingBalance: number | null;
  lastClosedAt: string | null;
  loading: boolean;
  fetchCurrentRegister: () => Promise<void>;
  openRegister: (openingBalance: number, note?: string) => Promise<boolean>;
  closeRegister: (closingBalance: number, note?: string) => Promise<boolean>;
  addTransaction: (type: "CASH_IN" | "CASH_OUT", amount: number, reason: string) => Promise<boolean>;
}

export const useCashRegisterStore = create<RegisterState>((set, get) => ({
  currentRegister: null,
  previousClosingBalance: null,
  lastClosedAt: null,
  loading: false,

  fetchCurrentRegister: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/cash-register");
      const data = await res.json();
      if (data.success) {
        set({
          currentRegister: data.data,
          previousClosingBalance: data.previousClosingBalance ?? 0,
          lastClosedAt: data.lastClosedAt ?? null,
        });
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
        await get().fetchCurrentRegister();
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
        await get().fetchCurrentRegister();
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
        await fetchCurrentRegister();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error adding transaction:", error);
      return false;
    }
  },
}));