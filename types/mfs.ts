export type MFSProvider = 'BKASH' | 'NAGAD' | 'ROCKET' | 'UPAY';
export type TransactionType = 'CASH_IN' | 'CASH_OUT' | 'RECHARGE';

export interface MFSWallet {
  id: string;
  provider: MFSProvider;
  agentNumber: string;
  eMoneyBalance: number; // ওয়ালেটের ডিজিটাল ব্যালেন্স
  cashBalance: number;   // ক্যাশ বক্সে থাকা ব্যালেন্স
}

export interface MFSTransaction {
  id: string;
  walletId: string;
  provider: MFSProvider;
  type: TransactionType;
  customerNumber: string;
  amount: number;
  commission: number;
  operator?: string; // Mobile Recharge এর ক্ষেত্রে
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  createdAt: Date;
}