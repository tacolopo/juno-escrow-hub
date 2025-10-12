// Phantom Wallet Type Declarations

import { PublicKey, Transaction } from "@solana/web3.js";

interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
  signAndSendTransaction(transaction: Transaction): Promise<{ signature: string }>;
  signMessage(message: Uint8Array, display?: string): Promise<{
    signature: Uint8Array;
    publicKey: PublicKey;
  }>;
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: PublicKey }>;
  disconnect(): Promise<void>;
  on(event: string, callback: (args: any) => void): void;
  removeListener(event: string, callback: (args: any) => void): void;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
    phantom?: {
      solana?: PhantomProvider;
    };
  }
}

export {};

