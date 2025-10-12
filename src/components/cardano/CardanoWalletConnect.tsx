import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, CheckCircle2 } from "lucide-react";
import { Lucid, Blockfrost } from "lucid-cardano";

declare global {
  interface Window {
    cardano?: {
      gerowallet?: {
        enable: () => Promise<any>;
        isEnabled: () => Promise<boolean>;
        name: string;
        icon: string;
      };
    };
  }
}

interface CardanoWalletConnectProps {
  onConnect: (address: string, lucid: Lucid) => void;
  onDisconnect: () => void;
  isConnected: boolean;
  address: string;
}

const BLOCKFROST_URL = "https://cardano-mainnet.blockfrost.io/api/v0";
const BLOCKFROST_API_KEY = "mainnetFreeApiKeyForPublicUse";

export const CardanoWalletConnect = ({
  onConnect,
  onDisconnect,
  isConnected,
  address,
}: CardanoWalletConnectProps) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const connectGeroWallet = async () => {
    setIsConnecting(true);
    try {
      // Check if Gero wallet is installed
      if (!window.cardano?.gerowallet) {
        throw new Error("Gero Wallet not found. Please install Gero Wallet extension.");
      }

      // Initialize Lucid
      const lucid = await Lucid.new(
        new Blockfrost(BLOCKFROST_URL, BLOCKFROST_API_KEY),
        "Mainnet"
      );

      // Enable Gero wallet
      const geroApi = await window.cardano.gerowallet.enable();
      
      // Select wallet in Lucid
      lucid.selectWallet(geroApi);

      // Get wallet address
      const address = await lucid.wallet.address();
      
      onConnect(address, lucid);
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      alert(error?.message || "Failed to connect to Gero Wallet. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
  };

  if (!isConnected) {
    return (
      <Card className="card-gradient border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Connect Gero Wallet
          </CardTitle>
          <CardDescription>
            Connect your Gero wallet to create and manage escrows on Cardano
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Secure wallet connection</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Cardano Mainnet support</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Full escrow functionality</span>
            </div>
          </div>

          <Button
            onClick={connectGeroWallet}
            disabled={isConnecting}
            className="w-full"
            size="lg"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {isConnecting ? "Connecting..." : "Connect Gero Wallet"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Don't have Gero Wallet?{" "}
            <a
              href="https://gerowallet.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Install here
            </a>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-gradient border-2 border-green-500/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-green-500" />
            <span>Gero Wallet Connected</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50">
            <span className="text-sm text-muted-foreground">Address:</span>
            <span className="text-sm font-mono">
              {address.slice(0, 12)}...{address.slice(-8)}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50">
            <span className="text-sm text-muted-foreground">Network:</span>
            <span className="text-sm font-medium text-green-500">Cardano Mainnet</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

