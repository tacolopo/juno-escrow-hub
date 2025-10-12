import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardanoWalletConnect } from "@/components/cardano/CardanoWalletConnect";
import { CreateCardanoEscrow, CardanoEscrowFormData } from "@/components/cardano/CreateCardanoEscrow";
import { CardanoEscrowList, CardanoEscrowData } from "@/components/cardano/CardanoEscrowList";
import { Plus, List, Sparkles, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/escrow-hero.jpg";
import planetIcon from "@/assets/planet-icon.png";

const SCRIPT_ADDRESS = "addr1wx3ueuc6rvyp9vxpz7y6nr7cu30g40wk723lwh42fq5ffwclf45nj";

const CardanoEscrow = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [walletAPI, setWalletAPI] = useState<any>(null);
  const [escrows, setEscrows] = useState<CardanoEscrowData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Handle wallet connection
  const handleWalletConnect = (address: string, api: any) => {
    setWalletAddress(address);
    setWalletAPI(api);
    setIsConnected(true);
    
    // Load escrows for this address
    loadEscrows(address);
  };

  const handleWalletDisconnect = () => {
    setIsConnected(false);
    setWalletAddress("");
    setWalletAPI(null);
    setEscrows([]);
  };

  // Load escrows from Cardano blockchain
  // Note: This is a placeholder. In production, you'd query the blockchain
  // using a service like Blockfrost, Koios, or running your own node
  const loadEscrows = async (address: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual blockchain query
      // For now, we'll show a message about connecting to Cardano infrastructure
      toast({
        title: "Loading Escrows",
        description: "Querying Cardano blockchain... This requires connection to a Cardano indexer service.",
      });
      
      // Placeholder for escrows
      setEscrows([]);
      
    } catch (error) {
      console.error("Failed to load escrows:", error);
      toast({
        title: "Failed to Load Escrows",
        description: "Could not fetch escrows from Cardano blockchain.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create new escrow
  const handleCreateEscrow = async (formData: CardanoEscrowFormData) => {
    if (!walletAddress || !walletAPI) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreating(true);
    try {
      // Convert ADA to lovelace
      const amountInLovelace = Math.floor(parseFloat(formData.amount) * 1000000);
      
      toast({
        title: "Creating Escrow",
        description: "This feature requires transaction building. Please note that creating escrows on Cardano requires building and submitting transactions to the smart contract.",
      });

      // TODO: Implement actual transaction building and submission
      // This would involve:
      // 1. Building a transaction that locks funds to the script address
      // 2. Including the escrow datum (escrow details)
      // 3. Signing with the wallet
      // 4. Submitting to the blockchain
      
      console.log("Creating escrow with data:", {
        ...formData,
        amountInLovelace,
        scriptAddress: SCRIPT_ADDRESS
      });

      // For now, show informational message
      toast({
        title: "Transaction Building Required",
        description: "To create an escrow, a transaction must be built and submitted to the Cardano blockchain. This requires integration with transaction building libraries.",
        variant: "destructive",
      });
      
    } catch (error: any) {
      console.error("Failed to create escrow:", error);
      toast({
        title: "Failed to Create Escrow",
        description: error?.message || "Could not create escrow. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Approve escrow release
  const handleApproveEscrow = async (escrowId: number) => {
    if (!walletAddress || !walletAPI) return;
    
    try {
      toast({
        title: "Approval Transaction",
        description: "Building approval transaction for escrow #" + escrowId,
      });

      // TODO: Implement approval transaction
      console.log("Approving escrow:", escrowId);

      toast({
        title: "Transaction Building Required",
        description: "Approval requires building a transaction with the ApproveRelease redeemer.",
        variant: "destructive",
      });
      
    } catch (error: any) {
      console.error("Failed to approve escrow:", error);
      toast({
        title: "Failed to Approve",
        description: error?.message || "Could not submit approval.",
        variant: "destructive",
      });
    }
  };

  // Cancel escrow
  const handleCancelEscrow = async (escrowId: number) => {
    if (!walletAddress || !walletAPI) return;
    
    try {
      toast({
        title: "Cancellation Transaction",
        description: "Building cancellation transaction for escrow #" + escrowId,
      });

      // TODO: Implement cancellation transaction
      console.log("Cancelling escrow:", escrowId);

      toast({
        title: "Transaction Building Required",
        description: "Cancellation requires building a transaction with the CancelEscrow redeemer.",
        variant: "destructive",
      });
      
    } catch (error: any) {
      console.error("Failed to cancel escrow:", error);
      toast({
        title: "Failed to Cancel",
        description: error?.message || "Could not cancel escrow.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header 
        className="relative border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(240, 240, 240, 0.02), rgba(240, 240, 240, 0.02)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm"></div>
        <div className="container mx-auto px-4 py-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="relative p-3 rounded-xl bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 animate-float">
                <img 
                  src={planetIcon} 
                  alt="Cardano" 
                  className="h-8 w-8 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  Cardano Escrow
                </h1>
                <p className="text-sm text-muted-foreground">
                  Multi-signature escrows on Cardano
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/50 px-3 py-2 rounded-lg backdrop-blur-sm border border-border/50">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span>Cardano Mainnet</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {!isConnected ? (
          <div className="max-w-md mx-auto">
            <CardanoWalletConnect
              onConnect={handleWalletConnect}
              onDisconnect={handleWalletDisconnect}
              isConnected={isConnected}
              address={walletAddress}
            />
            
            {/* Info Card */}
            <Card className="mt-6 border-blue-500/20 bg-blue-500/5">
              <CardContent className="pt-6">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">📝 Note:</p>
                  <p>
                    The Cardano escrow contract is deployed at:
                  </p>
                  <p className="font-mono text-xs bg-background/50 p-2 rounded break-all">
                    {SCRIPT_ADDRESS}
                  </p>
                  <p className="text-xs">
                    View on{" "}
                    <a 
                      href={`https://cardanoscan.io/address/${SCRIPT_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      CardanoScan
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Wallet Status */}
            <div className="animate-fade-in">
              <CardanoWalletConnect
                onConnect={handleWalletConnect}
                onDisconnect={handleWalletDisconnect}
                isConnected={isConnected}
                address={walletAddress}
              />
            </div>

            {/* Main Content */}
            <div className="animate-fade-in">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 bg-card/50">
                  <TabsTrigger value="create" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Escrow
                  </TabsTrigger>
                  <TabsTrigger value="escrows" className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    My Escrows
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="space-y-6 animate-fade-in">
                  <CreateCardanoEscrow
                    onCreateEscrow={handleCreateEscrow}
                    isCreating={isCreating}
                  />
                </TabsContent>

                <TabsContent value="escrows" className="space-y-6 animate-fade-in">
                  <Card className="card-gradient border-blue-500/30">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <List className="h-5 w-5 text-blue-500" />
                          My Escrows
                        </div>
                        <span className="text-sm font-normal text-muted-foreground">
                          {escrows.length} total
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardanoEscrowList
                        escrows={escrows}
                        currentAddress={walletAddress}
                        onApprove={handleApproveEscrow}
                        onCancel={handleCancelEscrow}
                        isLoading={isLoading}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 mt-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5"></div>
        <div className="container mx-auto px-4 py-6 relative z-10">
          <div className="text-center text-sm text-muted-foreground space-y-3">
            <p>Cardano multi-signature escrow powered by Plutus smart contracts</p>
            <p className="mt-1">Deployed on Cardano Mainnet</p>
            <p className="mt-1 font-mono text-xs opacity-75">
              Contract: {`${SCRIPT_ADDRESS.slice(0, 15)}...${SCRIPT_ADDRESS.slice(-8)}`}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CardanoEscrow;

