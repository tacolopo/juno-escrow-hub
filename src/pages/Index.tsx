import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletConnect } from "@/components/ui/WalletConnect";
import { CreateEscrow, EscrowFormData } from "@/components/CreateEscrow";
import { EscrowList, EscrowData } from "@/components/EscrowList";
import { Globe, Plus, List, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CosmWasmClient, SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { OfflineSigner } from "@cosmjs/proto-signing";
import heroImage from "@/assets/cosmos-hero.jpg";
import planetIcon from "@/assets/planet-icon.png";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as string;
const RPC_ENDPOINT = "https://juno-rpc.publicnode.com:443";

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [escrows, setEscrows] = useState<EscrowData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  
  const { toast } = useToast();

  // Initialize CosmWasm client
  const getQueryClient = async () => {
    return await CosmWasmClient.connect(RPC_ENDPOINT);
  };

  const getSigningClient = async (): Promise<SigningCosmWasmClient> => {
    if (!window.keplr) {
      throw new Error("Keplr not found");
    }

    await window.keplr.enable("juno-1");
    const offlineSigner = (await window.keplr.getOfflineSignerAuto("juno-1")) as OfflineSigner;
    
    return await SigningCosmWasmClient.connectWithSigner(RPC_ENDPOINT, offlineSigner);
  };

  // Load escrows for connected wallet
  const loadEscrows = async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      const client = await getQueryClient();
      const result = await client.queryContractSmart(CONTRACT_ADDRESS, {
        get_escrows_by_address: {
          address: walletAddress,
          limit: 50
        }
      });
      
      setEscrows(result.escrows || []);
    } catch (error) {
      console.error("Failed to load escrows:", error);
      toast({
        title: "Failed to Load Escrows",
        description: "Could not fetch escrows from the blockchain.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create new escrow
  const handleCreateEscrow = async (formData: EscrowFormData) => {
    if (!walletAddress) return;
    
    setIsCreating(true);
    try {
      const client = await getSigningClient();
      
      // Convert amount to micro units
      const amountInMicroUnits = Math.floor(parseFloat(formData.amount) * 1000000).toString();
      
      const msg = {
        create_escrow: {
          beneficiary: formData.beneficiary,
          approver1: formData.approver1,
          approver2: formData.approver2,
          approver3: formData.approver3 || undefined,
          description: formData.description,
        }
      };

      const funds = [{
        amount: amountInMicroUnits,
        denom: "ujuno"
      }];

      const result = await client.execute(
        walletAddress,
        CONTRACT_ADDRESS,
        msg,
        "auto",
        undefined,
        funds
      );

      console.log("Escrow created:", result);
      
      toast({
        title: "Escrow Created",
        description: "Your escrow has been successfully created on the blockchain.",
      });

      // Switch to escrows tab and reload
      setActiveTab("escrows");
      await loadEscrows();
      
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
    if (!walletAddress) return;
    
    try {
      const client = await getSigningClient();
      
      const msg = {
        approve_release: {
          escrow_id: escrowId
        }
      };

      await client.execute(
        walletAddress,
        CONTRACT_ADDRESS,
        msg,
        "auto"
      );

      toast({
        title: "Approval Submitted",
        description: "Your approval has been recorded on the blockchain.",
      });

      // Reload escrows
      await loadEscrows();
      
    } catch (error: any) {
      console.error("Failed to approve escrow:", error);
      toast({
        title: "Failed to Approve",
        description: error?.message || "Could not submit approval. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Cancel escrow
  const handleCancelEscrow = async (escrowId: number) => {
    if (!walletAddress) return;
    
    try {
      const client = await getSigningClient();
      
      const msg = {
        cancel_escrow: {
          escrow_id: escrowId
        }
      };

      await client.execute(
        walletAddress,
        CONTRACT_ADDRESS,
        msg,
        "auto"
      );

      toast({
        title: "Escrow Cancelled",
        description: "The escrow has been cancelled and funds returned.",
      });

      // Reload escrows
      await loadEscrows();
      
    } catch (error: any) {
      console.error("Failed to cancel escrow:", error);
      toast({
        title: "Failed to Cancel",
        description: error?.message || "Could not cancel escrow. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle wallet connection
  const handleWalletConnect = (address: string) => {
    setWalletAddress(address);
    setIsConnected(true);
  };

  // Load escrows when wallet connects
  useEffect(() => {
    if (isConnected && walletAddress) {
      loadEscrows();
    }
  }, [isConnected, walletAddress]);

  return (
    <div className="min-h-screen bg-background">
      {/* Cosmic Header */}
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
              <div className="relative p-3 rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/30 animate-float">
                <img 
                  src={planetIcon} 
                  alt="Cosmos Planet" 
                  className="h-8 w-8 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-cosmic opacity-20 rounded-xl animate-cosmic-glow"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/90 to-success bg-clip-text text-transparent">
                  Cosmos Escrow
                </h1>
                <p className="text-sm text-muted-foreground">
                  Interchain secure agreements
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/50 px-3 py-2 rounded-lg backdrop-blur-sm border border-border/50">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Cosmos Hub</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {!isConnected ? (
          <div className="max-w-md mx-auto">
            <WalletConnect
              onConnect={handleWalletConnect}
              isConnected={isConnected}
              address={walletAddress}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Wallet Status */}
            <div className="animate-fade-in">
              <WalletConnect
                onConnect={handleWalletConnect}
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
                  <CreateEscrow
                    onCreateEscrow={handleCreateEscrow}
                    isCreating={isCreating}
                  />
                </TabsContent>

                <TabsContent value="escrows" className="space-y-6 animate-fade-in">
                  <Card className="card-gradient">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <List className="h-5 w-5 text-primary" />
                          My Escrows
                        </div>
                        <span className="text-sm font-normal text-muted-foreground">
                          {escrows.length} total
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <EscrowList
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
        <div className="absolute inset-0 bg-gradient-cosmic opacity-5"></div>
        <div className="container mx-auto px-4 py-6 relative z-10">
          <div className="text-center text-sm text-muted-foreground">
            <p>Interchain escrow service powered by Cosmos ecosystem</p>
            <p className="mt-1">Currently deployed on Juno • Coming to Cosmos Hub</p>
            <p className="mt-1 font-mono text-xs opacity-75">
              Contract: {`${CONTRACT_ADDRESS.slice(0, 10)}...${CONTRACT_ADDRESS.slice(-8)}`}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;