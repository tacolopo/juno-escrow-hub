import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardanoWalletConnect } from "@/components/cardano/CardanoWalletConnect";
import { CreateCardanoEscrow, CardanoEscrowFormData } from "@/components/cardano/CreateCardanoEscrow";
import { CardanoEscrowList, CardanoEscrowData } from "@/components/cardano/CardanoEscrowList";
import { Plus, List, Sparkles, ArrowLeft, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import heroImage from "@/assets/escrow-hero.jpg";
import planetIcon from "@/assets/planet-icon.png";
import { MeshTxBuilder, BlockfrostProvider, mConStr0, mConStr1, serializePlutusScript, resolveDataHash } from "@meshsdk/core";

const SCRIPT_ADDRESS = "addr1wx3ueuc6rvyp9vxpz7y6nr7cu30g40wk723lwh42fq5ffwclf45nj";
const VALIDATOR_CBOR = "59027e0100003232323232322533300232323232325332330083001300937540042646644646464a66601c600600226464a666026602a0040082c6eb4c04c004c040dd50048a9998071803800899192999809980a8010020b1bad3013001301037540122c601c6ea802054ccc030c004c034dd5001099191919192999808980318091baa00c1323253330133370e6eb4c018c054dd50039bad30173015375401c2a6660260042002294052819198008029299980a29919980a98009bae3019301a301a301a301a30173754012294454ccc054c004dd7180c980d180d180d180d180d180b9baa00914a2264a66602c6016602e6ea80044c008dd7180d180c1baa00114a06032603460346034603460346034602e6ea8024dc7800899980a198011bac300530163754010466e3c0040092825114a044646600200200644a66603200229404cc894ccc060c0140085288998020020009bae301a001301b001333011300a30123754600260266ea801528251132323253330143370e6eb4c01cc058dd50041bad30183016375401e2a6660280062a666028004200229405280a50533301637586008602a6ea801c5288a5032323300100100622533301800114a026644a66602e66e3c0080145288998020020009bae3019001301a001375c602c602e60286ea8018ccc044c028c048dd5180098099baa0054a09448c054c058c058c058c058c058c058c058c058c0580048c050c054c054c054c054c054c054c054c054004dd618091809980998081baa300130103754014460240026020601c6ea800858dc3a4000601a002601a601c00260146ea8008dc3a40042c6014601600660120046010004601000260086ea8004526136565734aae7555cf2ab9f5742ae89";

// IMPORTANT: Add your Blockfrost API key here
// Get one free at: https://blockfrost.io/
const BLOCKFROST_API_KEY = import.meta.env.VITE_BLOCKFROST_API_KEY || "";

const CardanoEscrow = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [walletAPI, setWalletAPI] = useState<any>(null);
  const [escrows, setEscrows] = useState<CardanoEscrowData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const [escrowIdCounter, setEscrowIdCounter] = useState(1);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if Blockfrost API key is configured
  const isBlockfrostConfigured = !!BLOCKFROST_API_KEY && BLOCKFROST_API_KEY !== "mainnetYourBlockfrostKeyHere";

  // Handle wallet connection
  const handleWalletConnect = (address: string, api: any) => {
    setWalletAddress(address);
    setWalletAPI(api);
    setIsConnected(true);
    
    if (isBlockfrostConfigured) {
      loadEscrows(address);
    }
  };

  const handleWalletDisconnect = () => {
    setIsConnected(false);
    setWalletAddress("");
    setWalletAPI(null);
    setEscrows([]);
  };

  // Load escrows from Cardano blockchain
  const loadEscrows = async (address: string) => {
    if (!isBlockfrostConfigured) {
      toast({
        title: "Blockfrost API Key Required",
        description: "Please add your Blockfrost API key to query the blockchain.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const provider = new BlockfrostProvider(BLOCKFROST_API_KEY);
      
      // Query UTXOs at script address
      const utxos = await provider.fetchAddressUTxOs(SCRIPT_ADDRESS);
      
      const userEscrows: CardanoEscrowData[] = [];
      
      // Parse each UTXO's datum to extract escrow info
      for (const utxo of utxos) {
        if (utxo.output.plutusData) {
          try {
            // Parse datum - simplified, would need proper CBOR deserialization
            const escrow: CardanoEscrowData = {
              id: userEscrows.length + 1,
              creator: address, // Parse from datum
              beneficiary: "",
              amount_lovelace: parseInt(utxo.output.amount[0].quantity),
              approver1: "",
              approver2: "",
              approver3: null,
              description: "",
              approvals: [],
              is_completed: false,
              created_at: Date.now() / 1000,
              completed_at: null
            };
            
            // Filter to show only user's escrows
            if (escrow.creator === address || escrow.beneficiary === address) {
              userEscrows.push(escrow);
            }
          } catch (error) {
            console.error("Failed to parse escrow datum:", error);
          }
        }
      }
      
      setEscrows(userEscrows);
      
    } catch (error) {
      console.error("Failed to load escrows:", error);
      toast({
        title: "Failed to Load Escrows",
        description: "Could not fetch escrows from Cardano mainnet.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Build escrow datum
  const buildEscrowDatum = (
    escrowId: number,
    creator: string,
    beneficiary: string,
    amountLovelace: number,
    approver1: string,
    approver2: string,
    approver3: string | undefined,
    description: string
  ) => {
    // EscrowDatum constructor fields:
    // escrow_id, creator, beneficiary, amount_lovelace, approver1, approver2, approver3, 
    // description, approvals (list), is_completed (bool), created_at, completed_at (option)
    
    const datum = mConStr0([
      escrowId, // escrow_id
      creator, // creator address bytes
      beneficiary, // beneficiary address bytes
      amountLovelace, // amount_lovelace
      approver1, // approver1 address bytes
      approver2, // approver2 address bytes
      approver3 ? mConStr0([approver3]) : mConStr1([]), // Option<approver3>
      Buffer.from(description).toString('hex'), // description bytes
      [], // approvals list (empty initially)
      mConStr0([]), // False for is_completed
      Math.floor(Date.now() / 1000), // created_at timestamp
      mConStr1([]) // None for completed_at
    ]);
    
    return datum;
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

    if (!isBlockfrostConfigured) {
      toast({
        title: "Blockfrost API Key Required",
        description: "Please add VITE_BLOCKFROST_API_KEY to your .env file to create transactions.",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreating(true);
    try {
      const provider = new BlockfrostProvider(BLOCKFROST_API_KEY);
      const txBuilder = new MeshTxBuilder({
        fetcher: provider,
        submitter: provider,
      });

      // Convert ADA to lovelace
      const amountInLovelace = Math.floor(parseFloat(formData.amount) * 1000000);
      
      // Build datum
      const datum = buildEscrowDatum(
        escrowIdCounter,
        walletAddress,
        formData.beneficiary,
        amountInLovelace,
        formData.approver1,
        formData.approver2,
        formData.approver3,
        formData.description
      );

      // Get wallet UTXOs for funding
      const utxos = await walletAPI.getUtxos();
      
      // Build transaction
      const unsignedTx = await txBuilder
        .txOut(SCRIPT_ADDRESS, [{ unit: 'lovelace', quantity: amountInLovelace.toString() }])
        .txOutInlineDatumValue(datum)
        .changeAddress(walletAddress)
        .selectUtxosFrom(utxos)
        .complete();

      // Sign transaction with wallet
      const signedTx = await walletAPI.signTx(unsignedTx, true);
      
      // Submit transaction
      const txHash = await walletAPI.submitTx(signedTx);

      toast({
        title: "Escrow Created!",
        description: `Transaction submitted: ${txHash.slice(0, 16)}...`,
      });

      // Increment counter and reload
      setEscrowIdCounter(prev => prev + 1);
      setActiveTab("escrows");
      
      // Wait a bit for tx to be indexed
      setTimeout(() => loadEscrows(walletAddress), 3000);
      
    } catch (error: any) {
      console.error("Failed to create escrow:", error);
      toast({
        title: "Failed to Create Escrow",
        description: error?.message || error?.info || "Could not create escrow. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Approve escrow release
  const handleApproveEscrow = async (escrowId: number) => {
    if (!walletAddress || !walletAPI || !isBlockfrostConfigured) return;
    
    try {
      const provider = new BlockfrostProvider(BLOCKFROST_API_KEY);
      const txBuilder = new MeshTxBuilder({
        fetcher: provider,
        submitter: provider,
      });

      // Build ApproveRelease redeemer (constructor index 0 with escrow_id)
      const redeemer = mConStr0([escrowId]);
      
      // Find the UTXO for this escrow at the script address
      const scriptUtxos = await provider.fetchAddressUTxOs(SCRIPT_ADDRESS);
      
      // TODO: Find specific UTXO by parsing datum to match escrow_id
      const escrowUtxo = scriptUtxos[0]; // Simplified - needs proper lookup
      
      if (!escrowUtxo) {
        throw new Error("Escrow UTXO not found");
      }

      // Get wallet UTXOs
      const walletUtxos = await walletAPI.getUtxos();
      
      // Build spend from script transaction
      const unsignedTx = await txBuilder
        .spendingPlutusScriptV2()
        .txIn(escrowUtxo.input.txHash, escrowUtxo.input.outputIndex)
        .txInInlineDatumPresent()
        .txInRedeemerValue(redeemer)
        .txInScript(VALIDATOR_CBOR)
        .changeAddress(walletAddress)
        .selectUtxosFrom(walletUtxos)
        .complete();

      // Sign and submit
      const signedTx = await walletAPI.signTx(unsignedTx, true);
      const txHash = await walletAPI.submitTx(signedTx);

      toast({
        title: "Approval Submitted!",
        description: `Transaction: ${txHash.slice(0, 16)}...`,
      });

      setTimeout(() => loadEscrows(walletAddress), 3000);
      
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
    if (!walletAddress || !walletAPI || !isBlockfrostConfigured) return;
    
    try {
      const provider = new BlockfrostProvider(BLOCKFROST_API_KEY);
      const txBuilder = new MeshTxBuilder({
        fetcher: provider,
        submitter: provider,
      });

      // Build CancelEscrow redeemer (constructor index 1 with escrow_id)
      const redeemer = mConStr1([escrowId]);
      
      // Find the UTXO
      const scriptUtxos = await provider.fetchAddressUTxOs(SCRIPT_ADDRESS);
      const escrowUtxo = scriptUtxos[0]; // Simplified
      
      if (!escrowUtxo) {
        throw new Error("Escrow UTXO not found");
      }

      const walletUtxos = await walletAPI.getUtxos();
      
      const unsignedTx = await txBuilder
        .spendingPlutusScriptV2()
        .txIn(escrowUtxo.input.txHash, escrowUtxo.input.outputIndex)
        .txInInlineDatumPresent()
        .txInRedeemerValue(redeemer)
        .txInScript(VALIDATOR_CBOR)
        .txOut(walletAddress, escrowUtxo.output.amount) // Return funds to creator
        .changeAddress(walletAddress)
        .selectUtxosFrom(walletUtxos)
        .requiredSignerHash(await walletAPI.getChangeAddress()) // Creator must sign
        .complete();

      const signedTx = await walletAPI.signTx(unsignedTx, true);
      const txHash = await walletAPI.submitTx(signedTx);

      toast({
        title: "Cancellation Submitted!",
        description: `Transaction: ${txHash.slice(0, 16)}...`,
      });

      setTimeout(() => loadEscrows(walletAddress), 3000);
      
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
        {!isBlockfrostConfigured && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Blockfrost API Key Required</AlertTitle>
            <AlertDescription>
              To interact with Cardano mainnet, add your Blockfrost API key as VITE_BLOCKFROST_API_KEY in your .env file.
              Get a free key at <a href="https://blockfrost.io/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">blockfrost.io</a>
            </AlertDescription>
          </Alert>
        )}

        {!isConnected ? (
          <div className="max-w-md mx-auto">
            <CardanoWalletConnect
              onConnect={handleWalletConnect}
              onDisconnect={handleWalletDisconnect}
              isConnected={isConnected}
              address={walletAddress}
            />
            
            <Card className="mt-6 border-blue-500/20 bg-blue-500/5">
              <CardContent className="pt-6">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">📝 Cardano Escrow Contract:</p>
                  <p className="font-mono text-xs bg-background/50 p-2 rounded break-all">
                    {SCRIPT_ADDRESS}
                  </p>
                  <p className="text-xs">
                    <a 
                      href={`https://cardanoscan.io/address/${SCRIPT_ADDRESS}?tab=transactions`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      View on CardanoScan →
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="animate-fade-in">
              <CardanoWalletConnect
                onConnect={handleWalletConnect}
                onDisconnect={handleWalletDisconnect}
                isConnected={isConnected}
                address={walletAddress}
              />
            </div>

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

      <footer className="border-t border-border/50 bg-card/30 mt-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5"></div>
        <div className="container mx-auto px-4 py-6 relative z-10">
          <div className="text-center text-sm text-muted-foreground space-y-3">
            <p>Cardano multi-signature escrow powered by Plutus smart contracts</p>
            <p className="mt-1">Deployed on Cardano Mainnet • PlutusV2</p>
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
