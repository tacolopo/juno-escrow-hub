import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CardanoWalletConnectProps {
  onConnect: (address: string, api: any) => void;
  onDisconnect: () => void;
  isConnected: boolean;
  address?: string;
}

export const CardanoWalletConnect = ({ 
  onConnect, 
  onDisconnect, 
  isConnected, 
  address 
}: CardanoWalletConnectProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const connectGero = async () => {
    // Check if Gero wallet is installed
    if (!window.cardano?.gerowallet && !window.cardano?.gero) {
      toast({
        title: "Gero Wallet Not Found",
        description: "Please install the Gero wallet extension.",
        variant: "destructive",
      });
      window.open("https://gerowallet.io/", "_blank");
      return;
    }

    setIsConnecting(true);
    try {
      // Try both possible Gero API locations
      const geroAPI = window.cardano?.gerowallet || window.cardano?.gero;
      
      if (!geroAPI) {
        throw new Error("Gero wallet API not found");
      }

      // Enable the wallet
      const api = await geroAPI.enable();
      
      // Get the wallet address
      const addresses = await api.getUsedAddresses();
      if (!addresses || addresses.length === 0) {
        // If no used addresses, try unused addresses
        const unusedAddresses = await api.getUnusedAddresses();
        if (!unusedAddresses || unusedAddresses.length === 0) {
          throw new Error("No addresses found in wallet");
        }
        
        // Decode the address from CBOR hex
        const addressHex = unusedAddresses[0];
        const address = decodeAddress(addressHex);
        onConnect(address, api);
      } else {
        // Decode the address from CBOR hex
        const addressHex = addresses[0];
        const address = decodeAddress(addressHex);
        onConnect(address, api);
      }
      
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Gero Wallet",
      });
    } catch (error) {
      console.error("Failed to connect to Gero:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Gero wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Simple function to decode Cardano address from hex
  const decodeAddress = (addressHex: string): string => {
    try {
      // Remove '0x' prefix if present
      const hex = addressHex.startsWith('0x') ? addressHex.slice(2) : addressHex;
      
      // Convert hex to bytes
      const bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
      
      // Bech32 encode (simplified - using the raw hex for now)
      // In production, you'd use a proper Cardano library
      // For display purposes, we'll just format the hex
      return `addr1${hex.slice(0, 58)}`;
    } catch (error) {
      console.error("Failed to decode address:", error);
      return addressHex;
    }
  };

  if (isConnected && address) {
    return (
      <Card className="p-4 border-blue-500/20 bg-blue-500/5">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-blue-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-500">Gero Wallet Connected</p>
            <p className="text-xs text-muted-foreground font-mono">
              {`${address.slice(0, 15)}...${address.slice(-8)}`}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onDisconnect}>
            Disconnect
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5"></div>
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-blue-500/10 relative">
          <Wallet className="h-8 w-8 text-blue-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Connect Gero Wallet</h3>
          <p className="text-sm text-muted-foreground">
            Connect your Gero wallet to interact with Cardano escrows
          </p>
        </div>
        <Button
          onClick={connectGero}
          disabled={isConnecting}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 hover:from-blue-600 hover:to-cyan-600"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Gero
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          Don't have Gero?{" "}
          <a 
            href="https://gerowallet.io/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Install it here
          </a>
        </p>
      </div>
    </Card>
  );
};

