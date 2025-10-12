import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PublicKey } from "@solana/web3.js";

interface SolanaWalletConnectProps {
  onConnect: (address: string, provider: any) => void;
  onDisconnect: () => void;
  isConnected: boolean;
  address?: string;
}

export const SolanaWalletConnect = ({ 
  onConnect, 
  onDisconnect, 
  isConnected, 
  address 
}: SolanaWalletConnectProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Listen for account changes
  useEffect(() => {
    const provider = window.solana || window.phantom?.solana;
    
    if (provider) {
      const handleAccountChanged = (publicKey: PublicKey | null) => {
        if (publicKey) {
          console.log("Account changed to:", publicKey.toString());
        } else {
          onDisconnect();
        }
      };

      provider.on("accountChanged", handleAccountChanged);
      
      return () => {
        provider.removeListener("accountChanged", handleAccountChanged);
      };
    }
  }, [onDisconnect]);

  const connectPhantom = async () => {
    const provider = window.solana || window.phantom?.solana;
    
    // Check if Phantom is installed
    if (!provider || !provider.isPhantom) {
      toast({
        title: "Phantom Wallet Not Found",
        description: "Please install the Phantom wallet extension.",
        variant: "destructive",
      });
      window.open("https://phantom.app/", "_blank");
      return;
    }

    setIsConnecting(true);
    try {
      // Connect to Phantom
      const response = await provider.connect();
      const publicKey = response.publicKey.toString();
      
      onConnect(publicKey, provider);
      
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Phantom Wallet",
      });
    } catch (error) {
      console.error("Failed to connect to Phantom:", error);
      
      if (error instanceof Error) {
        if (error.message.includes("User rejected")) {
          toast({
            title: "Connection Rejected",
            description: "You rejected the connection request.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Connection Failed",
            description: error.message || "Failed to connect to Phantom wallet.",
            variant: "destructive",
          });
        }
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    const provider = window.solana || window.phantom?.solana;
    
    if (provider) {
      try {
        await provider.disconnect();
      } catch (error) {
        console.error("Error disconnecting:", error);
      }
    }
    
    onDisconnect();
    toast({
      title: "Wallet Disconnected",
      description: "Your Phantom wallet has been disconnected.",
    });
  };

  if (isConnected && address) {
    return (
      <Card className="p-4 border-purple-500/20 bg-purple-500/5">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-purple-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-500">Phantom Wallet Connected</p>
            <p className="text-xs text-muted-foreground font-mono">
              {`${address.slice(0, 8)}...${address.slice(-6)}`}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-purple-500/10 relative">
          <Wallet className="h-8 w-8 text-purple-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Connect Phantom Wallet</h3>
          <p className="text-sm text-muted-foreground">
            Connect your Phantom wallet to interact with Solana escrows
          </p>
        </div>
        <Button
          onClick={connectPhantom}
          disabled={isConnecting}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 hover:from-purple-600 hover:to-pink-600"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Phantom
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          Don't have Phantom?{" "}
          <a 
            href="https://phantom.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-purple-500 hover:underline"
          >
            Install it here
          </a>
        </p>
      </div>
    </Card>
  );
};

