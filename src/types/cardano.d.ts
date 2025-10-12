// Gero Wallet API Type Declarations

interface CardanoAPI {
  enable(): Promise<CardanoWalletAPI>;
  isEnabled(): Promise<boolean>;
  apiVersion: string;
  name: string;
  icon: string;
}

interface CardanoWalletAPI {
  getNetworkId(): Promise<number>;
  getUtxos(amount?: string, paginate?: Paginate): Promise<string[] | undefined>;
  getBalance(): Promise<string>;
  getUsedAddresses(): Promise<string[]>;
  getUnusedAddresses(): Promise<string[]>;
  getChangeAddress(): Promise<string>;
  getRewardAddresses(): Promise<string[]>;
  signTx(tx: string, partialSign?: boolean): Promise<string>;
  signData(address: string, payload: string): Promise<DataSignature>;
  submitTx(tx: string): Promise<string>;
  experimental: {
    getCollateral(): Promise<string[]>;
  };
}

interface DataSignature {
  signature: string;
  key: string;
}

interface Paginate {
  page: number;
  limit: number;
}

declare global {
  interface Window {
    cardano?: {
      gerowallet?: CardanoAPI;
      gero?: CardanoAPI;
    };
  }
}

export {};

