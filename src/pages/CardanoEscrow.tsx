import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardanoWalletConnect } from "@/components/cardano/CardanoWalletConnect";
import { CardanoCreateEscrow, CardanoEscrowFormData } from "@/components/cardano/CardanoCreateEscrow";
import { CardanoEscrowList, CardanoEscrowData } from "@/components/cardano/CardanoEscrowList";
import { Shield, Plus, List, Sparkles, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/escrow-hero.jpg";
import planetIcon from "@/assets/planet-icon.png";
import { Lucid, Blockfrost, fromText, toText, Data, Constr } from "lucid-cardano";

const SCRIPT_ADDRESS = "addr1wx3ueuc6rvyp9vxpz7y6nr7cu30g40wk723lwh42fq5ffwclf45nj";
const BLOCKFROST_API_KEY = "mainnetFreeApiKeyForPublicUse"; // Public Koios endpoint
const BLOCKFROST_URL = "https://cardano-mainnet.blockfrost.io/api/v0";

// Plutus script from deployment
const VALIDATOR_SCRIPT = "59027e0100003232323232322533300232323232325332330083001300937540042646644646464a66601c600600226464a666026602a0040082c6eb4c04c004c040dd50048a9998071803800899192999809980a8010020b1bad3013001301037540122c601c6ea802054ccc030c004c034dd5001099191919192999808980318091baa00c1323253330133370e6eb4c018c054dd50039bad30173015375401c2a6660260042002294052819198008029299980a29919980a98009bae3019301a301a301a301a30173754012294454ccc054c004dd7180c980d180d180d180d180d180b9baa00914a2264a66602c6016602e6ea80044c008dd7180d180c1baa00114a06032603460346034603460346034602e6ea8024dc7800899980a198011bac300530163754010466e3c0040092825114a044646600200200644a66603200229404cc894ccc060c0140085288998020020009bae301a001301b001333011300a30123754600260266ea801528251132323253330143370e6eb4c01cc058dd50041bad30183016375401e2a6660280062a666028004200229405280a50533301637586008602a6ea801c5288a5032323300100100622533301800114a026644a66602e66e3c0080145288998020020009bae3019001301a001375c602c602e60286ea8018ccc044c028c048dd5180098099baa0054a09448c054c058c058c058c058c058c058c058c058c0580048c050c054c054c054c054c054c054c054c054004dd618091809980998081baa300130103754014460240026020601c6ea800858dc3a4000601a002601a601c00260146ea8008dc3a40042c6014601600660120046010004601000260086ea8004526136565734aae7555cf2ab9f5742ae89";

const CardanoEscrow = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [escrows, setEscrows] = useState<CardanoEscrowData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const [lucid, setLucid] = useState<Lucid | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize Lucid with Gero wallet
  const initializeLucid = async () => {
    try {
      const lucidInstance = await Lucid.new(
        new Blockfrost(BLOCKFROST_URL, BLOCKFROST_API_KEY),
        "Mainnet"
      );
      setLucid(lucidInstance);
      return lucidInstance;
    } catch (error) {
      console.error("Failed to initialize Lucid:", error);
      toast({
        title: "Initialization Failed",
        description: "Could not connect to Cardano network.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Load escrows from script address
  const loadEscrows = async () => {
    if (!lucid || !walletAddress) return;
    
    setIsLoading(true);
    try {
      const utxos = await lucid.utxosAt(SCRIPT_ADDRESS);
      
      const parsedEscrows: CardanoEscrowData[] = utxos.map((utxo, index) => {
        try {
          if (!utxo.datum) return null;
          
          // Parse datum
          const datum = Data.from(utxo.datum);
          const escrowData = datum as any;
          
          return {
            id: index,
            creator: escrowData.fields[1],
            beneficiary: escrowData.fields[2],
            amount: Number(utxo.assets.lovelace) / 1_000_000,
            approver1: escrowData.fields[4],
            approver2: escrowData.fields[5],
            approver3: escrowData.fields[6]?.fields?.[0] || undefined,
            description: toText(escrowData.fields[7]),
            approvals: escrowData.fields[8] || [],
            isCompleted: escrowData.fields[9]?.index === 1,
            createdAt: Number(escrowData.fields[10]),
            completedAt: escrowData.fields[11]?.fields?.[0],
            utxo: utxo,
          };
        } catch (error) {
          console.error("Failed to parse escrow:", error);
          return null;
        }
      }).filter((e): e is CardanoEscrowData => e !== null);
      
      setEscrows(parsedEscrows);
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
  const handleCreateEscrow = async (formData: CardanoEscrowFormData) => {
    if (!lucid || !walletAddress) return;
    
    setIsCreating(true);
    try {
      const amountLovelace = BigInt(Math.floor(parseFloat(formData.amount) * 1_000_000));
      const createdAt = BigInt(Date.now());
      
      // Build escrow datum
      const escrowDatum = Data.to(new Constr(0, [
        BigInt(Date.now()), // escrow_id (use timestamp for uniqueness)
        fromText(walletAddress), // creator
        fromText(formData.beneficiary), // beneficiary
        amountLovelace, // amount_lovelace
        fromText(formData.approver1), // approver1
        fromText(formData.approver2), // approver2
        formData.approver3 ? new Constr(0, [fromText(formData.approver3)]) : new Constr(1, []), // approver3 (Option)
        fromText(formData.description), // description
        [], // approvals (empty list)
        new Constr(0, []), // is_completed (False)
        createdAt, // created_at
        new Constr(1, []), // completed_at (None)
      ]));

      const tx = await lucid
        .newTx()
        .payToContract(SCRIPT_ADDRESS, { inline: escrowDatum }, { lovelace: amountLovelace })
        .complete();

      const signedTx = await tx.sign().complete();
      const txHash = await signedTx.submit();

      toast({
        title: "Escrow Created",
        description: `Transaction submitted: ${txHash.slice(0, 10)}...`,
      });

      // Wait for confirmation and reload
      await lucid.awaitTx(txHash);
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
  const handleApproveEscrow = async (escrow: CardanoEscrowData) => {
    if (!lucid || !walletAddress) return;
    
    try {
      // Build redeemer for approval
      const redeemer = Data.to(new Constr(0, [BigInt(escrow.id)])); // ApproveRelease
      
      // Get current approvals and add new one
      const updatedApprovals = [...escrow.approvals, fromText(walletAddress)];
      
      // Check if we have 2 approvals (release condition met)
      const shouldRelease = updatedApprovals.length >= 2;
      
      if (shouldRelease) {
        // Release funds to beneficiary
        const tx = await lucid
          .newTx()
          .collectFrom([escrow.utxo], redeemer)
          .attachSpendingValidator({
            type: "PlutusV2",
            script: VALIDATOR_SCRIPT,
          })
          .payToAddress(escrow.beneficiary, { lovelace: BigInt(escrow.amount * 1_000_000) })
          .complete();

        const signedTx = await tx.sign().complete();
        const txHash = await signedTx.submit();

        toast({
          title: "Escrow Released",
          description: `Funds released to beneficiary. TX: ${txHash.slice(0, 10)}...`,
        });

        await lucid.awaitTx(txHash);
      } else {
        // Update datum with new approval
        const updatedDatum = Data.to(new Constr(0, [
          BigInt(escrow.id),
          fromText(escrow.creator),
          fromText(escrow.beneficiary),
          BigInt(escrow.amount * 1_000_000),
          fromText(escrow.approver1),
          fromText(escrow.approver2),
          escrow.approver3 ? new Constr(0, [fromText(escrow.approver3)]) : new Constr(1, []),
          fromText(escrow.description),
          updatedApprovals,
          new Constr(0, []), // still not completed
          BigInt(escrow.createdAt),
          new Constr(1, []),
        ]));

        const tx = await lucid
          .newTx()
          .collectFrom([escrow.utxo], redeemer)
          .attachSpendingValidator({
            type: "PlutusV2",
            script: VALIDATOR_SCRIPT,
          })
          .payToContract(SCRIPT_ADDRESS, { inline: updatedDatum }, { lovelace: BigInt(escrow.amount * 1_000_000) })
          .complete();

        const signedTx = await tx.sign().complete();
        const txHash = await signedTx.submit();

        toast({
          title: "Approval Submitted",
          description: `Your approval has been recorded. TX: ${txHash.slice(0, 10)}...`,
        });

        await lucid.awaitTx(txHash);
      }
      
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
  const handleCancelEscrow = async (escrow: CardanoEscrowData) => {
    if (!lucid || !walletAddress) return;
    
    try {
      const redeemer = Data.to(new Constr(1, [BigInt(escrow.id)])); // CancelEscrow

      const tx = await lucid
        .newTx()
        .collectFrom([escrow.utxo], redeemer)
        .attachSpendingValidator({
          type: "PlutusV2",
          script: VALIDATOR_SCRIPT,
        })
        .payToAddress(escrow.creator, { lovelace: BigInt(escrow.amount * 1_000_000) })
        .addSigner(walletAddress)
        .complete();

      const signedTx = await tx.sign().complete();
      const txHash = await signedTx.submit();

      toast({
        title: "Escrow Cancelled",
        description: `Escrow cancelled and funds returned. TX: ${txHash.slice(0, 10)}...`,
      });

      await lucid.awaitTx(txHash);
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
  const handleWalletConnect = async (address: string, lucidInstance: Lucid) => {
    setWalletAddress(address);
    setLucid(lucidInstance);
    setIsConnected(true);
  };

  // Load escrows when wallet connects
  useEffect(() => {
    if (isConnected && walletAddress && lucid) {
      loadEscrows();
    }
  }, [isConnected, walletAddress, lucid]);

  // Initialize Lucid on mount
  useEffect(() => {
    initializeLucid();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Cardano Header */}
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
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-lg bg-card/50 hover:bg-card transition-colors border border-border/50"
                title="Back to home"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="relative p-3 rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/30 animate-float">
                <img 
                  src={planetIcon} 
                  alt="Cardano" 
                  className="h-8 w-8 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-cosmic opacity-20 rounded-xl animate-cosmic-glow"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/90 to-success bg-clip-text text-transparent">
                  Cardano Escrow
                </h1>
                <p className="text-sm text-muted-foreground">
                  Secure Plutus V2 escrow agreements
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/50 px-3 py-2 rounded-lg backdrop-blur-sm border border-border/50">
              <Sparkles className="h-4 w-4 text-primary" />
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
              onDisconnect={() => {
                setIsConnected(false);
                setWalletAddress("");
                setEscrows([]);
                setLucid(null);
              }}
              isConnected={isConnected}
              address={walletAddress}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Wallet Status */}
            <div className="animate-fade-in">
              <CardanoWalletConnect
                onConnect={handleWalletConnect}
                onDisconnect={() => {
                  setIsConnected(false);
                  setWalletAddress("");
                  setEscrows([]);
                  setLucid(null);
                }}
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
                  <CardanoCreateEscrow
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
        <div className="absolute inset-0 bg-gradient-cosmic opacity-5"></div>
        <div className="container mx-auto px-4 py-6 relative z-10">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>Cardano escrow service powered by Plutus V2</p>
            <p className="mt-1">Production-ready Aiken contracts • Secure multi-signature escrows</p>
            <p className="mt-1 font-mono text-xs opacity-75">
              Script: {`${SCRIPT_ADDRESS.slice(0, 10)}...${SCRIPT_ADDRESS.slice(-8)}`}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CardanoEscrow;

