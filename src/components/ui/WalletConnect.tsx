import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, CheckCircle, AlertCircle, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  isConnected: boolean;
  address?: string;
}

export const WalletConnect = ({ onConnect, onDisconnect, isConnected, address }: WalletConnectProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const connectKeplr = async () => {
    if (!window.keplr) {
      toast({
        title: "Keplr Not Found",
        description: "Please install the Keplr wallet extension.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      // Request access to Cosmos Hub mainnet
      await window.keplr.enable("cosmoshub-4");
      
      // Get the key from Keplr
      const key = await window.keplr.getKey("cosmoshub-4");
      onConnect(key.bech32Address);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${key.name || "Keplr Wallet"}`,
      });
    } catch (error) {
      console.error("Failed to connect to Keplr:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Keplr wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  if (isConnected && address) {
    return (
      <Card className="p-4 border-success/20 bg-success/5">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-success" />
          <div className="flex-1">
            <p className="text-sm font-medium text-success">Wallet Connected</p>
            <p className="text-xs text-muted-foreground font-mono">
              {`${address.slice(0, 10)}...${address.slice(-8)}`}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onDisconnect}>Disconnect</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-cosmic opacity-5"></div>
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-primary/10 relative">
          <Wallet className="h-8 w-8 text-primary" />
          <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-full"></div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
          <p className="text-sm text-muted-foreground">
            Connect your Keplr wallet to interact with Cosmos ecosystem
          </p>
        </div>
        <Button
          onClick={connectKeplr}
          disabled={isConnecting}
          className="btn-gradient-cosmic text-primary-foreground px-8"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Connecting...
            </>
          ) : (
            <>
              <Globe className="mr-2 h-4 w-4" />
              Connect Keplr
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

// Declare global window type for Keplr
declare global {
  interface Window {
    keplr?: any;
  }
}