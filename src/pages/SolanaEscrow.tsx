import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SolanaWalletConnect } from "@/components/solana/SolanaWalletConnect";
import { CreateSolanaEscrow, SolanaEscrowFormData } from "@/components/solana/CreateSolanaEscrow";
import { SolanaEscrowList, SolanaEscrowData } from "@/components/solana/SolanaEscrowList";
import { Plus, List, Sparkles, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/escrow-hero.jpg";
import planetIcon from "@/assets/planet-icon.png";
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction
} from "@solana/web3.js";
// Helper to convert string to Uint8Array (browser-native, no Buffer needed)
const stringToUint8Array = (str: string): Uint8Array => {
  return new TextEncoder().encode(str);
};

// Helper to convert number to little-endian Uint8Array
const numberToLEBytes = (num: number | bigint): Uint8Array => {
  const arr = new Uint8Array(8);
  const view = new DataView(arr.buffer);
  view.setBigUint64(0, BigInt(num), true); // true = little endian
  return arr;
};

// Helper to serialize CreateEscrow instruction manually (Borsh format)
const serializeCreateEscrow = (
  amount: bigint,
  beneficiary: Uint8Array,
  approver1: Uint8Array,
  approver2: Uint8Array,
  approver3: Uint8Array | null,
  description: string
): Uint8Array => {
  const descBytes = stringToUint8Array(description);
  const descLen = new Uint8Array(4);
  new DataView(descLen.buffer).setUint32(0, descBytes.length, true); // little endian

  const parts: Uint8Array[] = [
    new Uint8Array([1]), // Enum discriminator for CreateEscrow
    numberToLEBytes(amount), // u64
    beneficiary, // 32 bytes
    approver1, // 32 bytes
    approver2, // 32 bytes
  ];

  // Option<Pubkey> - 1 byte discriminator + optional 32 bytes
  if (approver3) {
    parts.push(new Uint8Array([1])); // Some
    parts.push(approver3);
  } else {
    parts.push(new Uint8Array([0])); // None
  }

  // String - 4 bytes length + string data
  parts.push(descLen);
  parts.push(descBytes);

  // Calculate total length
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(totalLength);
  
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return result;
};

const PROGRAM_ID = new PublicKey("CzxXQzXVUBSmmj2kAhERmb8spjHAd31cVMYCXfYpKDM3");
const SOLANA_RPC = "https://api.devnet.solana.com";

const SolanaEscrow = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [walletProvider, setWalletProvider] = useState<any>(null);
  const [escrows, setEscrows] = useState<SolanaEscrowData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Handle wallet connection
  const handleWalletConnect = (address: string, provider: any) => {
    setWalletAddress(address);
    setWalletProvider(provider);
    setIsConnected(true);
    
    // Load escrows for this address
    loadEscrows(address);
  };

  const handleWalletDisconnect = () => {
    setIsConnected(false);
    setWalletAddress("");
    setWalletProvider(null);
    setEscrows([]);
  };

  // Load escrows from Solana blockchain
  const loadEscrows = async (address: string) => {
    setIsLoading(true);
    try {
      const connection = new Connection(SOLANA_RPC, "confirmed");
      
      // Find counter PDA
      const [counterPda] = PublicKey.findProgramAddressSync(
        [stringToUint8Array("counter")],
        PROGRAM_ID
      );

      // Try to fetch counter account to get total escrow count
      try {
        const counterInfo = await connection.getAccountInfo(counterPda);
        
        if (counterInfo && counterInfo.data.length >= 8) {
          // Parse count from account data (first 8 bytes as u64)
          const count = Number(counterInfo.data.readBigUInt64LE(0));
          console.log(`Total escrows created: ${count}`);
          
          // Fetch user's escrows
          const userEscrows: SolanaEscrowData[] = [];
          
          for (let i = 1; i <= count && i <= 50; i++) {
            const escrowId = BigInt(i);
            const [escrowPda] = PublicKey.findProgramAddressSync(
              [
                stringToUint8Array("escrow"),
                numberToLEBytes(escrowId)
              ],
              PROGRAM_ID
            );

            const escrowInfo = await connection.getAccountInfo(escrowPda);
            if (escrowInfo && escrowInfo.data.length > 0) {
              // Parse escrow data
              // This is a simplified parser - in production use proper borsh deserialization
              const parsed = parseEscrowData(escrowInfo.data, i);
              
              // Filter escrows related to this user
              if (parsed && (
                parsed.creator === address ||
                parsed.beneficiary === address ||
                parsed.approver1 === address ||
                parsed.approver2 === address ||
                (parsed.approver3 && parsed.approver3 === address)
              )) {
                userEscrows.push(parsed);
              }
            }
          }
          
          setEscrows(userEscrows);
          
          if (userEscrows.length === 0) {
            toast({
              title: "No Escrows Found",
              description: "You don't have any escrows yet on Solana devnet.",
            });
          }
        } else {
          console.log("Counter not initialized");
          toast({
            title: "Program Not Initialized",
            description: "The escrow program counter is not initialized on devnet.",
          });
        }
      } catch (error) {
        console.error("Error fetching escrows:", error);
        toast({
          title: "Loading Escrows",
          description: "Could not load escrows. The program may not be initialized.",
        });
      }
      
    } catch (error) {
      console.error("Failed to load escrows:", error);
      toast({
        title: "Failed to Load Escrows",
        description: "Could not connect to Solana devnet.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Parser for escrow data using Borsh format
  const parseEscrowData = (data: Uint8Array, id: number): SolanaEscrowData | null => {
    try {
      if (data.length < 8) return null;
      
      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      let offset = 0;

      // id: u64
      const escrowId = Number(view.getBigUint64(offset, true));
      offset += 8;

      // creator: Pubkey (32 bytes)
      const creator = new PublicKey(data.slice(offset, offset + 32)).toBase58();
      offset += 32;

      // beneficiary: Pubkey (32 bytes)
      const beneficiary = new PublicKey(data.slice(offset, offset + 32)).toBase58();
      offset += 32;

      // amount: u64
      const amount_lamports = Number(view.getBigUint64(offset, true));
      offset += 8;

      // approver1: Pubkey (32 bytes)
      const approver1 = new PublicKey(data.slice(offset, offset + 32)).toBase58();
      offset += 32;

      // approver2: Pubkey (32 bytes)
      const approver2 = new PublicKey(data.slice(offset, offset + 32)).toBase58();
      offset += 32;

      // approver3: Option<Pubkey> (1 byte + optional 32 bytes)
      const hasApprover3 = data[offset] === 1;
      offset += 1;
      let approver3: string | null = null;
      if (hasApprover3) {
        approver3 = new PublicKey(data.slice(offset, offset + 32)).toBase58();
        offset += 32;
      }

      // description: String (4 bytes length + data)
      const descLength = view.getUint32(offset, true);
      offset += 4;
      const description = new TextDecoder().decode(data.slice(offset, offset + descLength));
      offset += descLength;

      // approvals: Vec<Pubkey> (4 bytes length + 32 bytes per entry)
      const approvalsCount = view.getUint32(offset, true);
      offset += 4;
      const approvals: string[] = [];
      for (let i = 0; i < approvalsCount; i++) {
        approvals.push(new PublicKey(data.slice(offset, offset + 32)).toBase58());
        offset += 32;
      }

      // is_completed: bool (1 byte)
      const is_completed = data[offset] === 1;
      offset += 1;

      // created_at: i64
      const created_at = Number(view.getBigInt64(offset, true));
      offset += 8;

      // completed_at: i64
      const completed_at = Number(view.getBigInt64(offset, true));
      offset += 8;

      return {
        id: escrowId,
        creator,
        beneficiary,
        amount_lamports,
        approver1,
        approver2,
        approver3,
        description,
        approvals,
        is_completed,
        created_at,
        completed_at: completed_at === 0 ? null : completed_at
      };
    } catch (error) {
      console.error("Failed to parse escrow data:", error);
      return null;
    }
  };

  // Create new escrow
  const handleCreateEscrow = async (formData: SolanaEscrowFormData) => {
    if (!walletAddress || !walletProvider) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreating(true);
    try {
      const connection = new Connection(SOLANA_RPC, "confirmed");
      const creatorPubkey = new PublicKey(walletAddress);
      
      // Convert SOL to lamports
      const amountInLamports = parseFloat(formData.amount) * LAMPORTS_PER_SOL;
      
      // Find counter PDA
      const [counterPda] = PublicKey.findProgramAddressSync(
        [stringToUint8Array("counter")],
        PROGRAM_ID
      );

      // Get counter to determine next escrow ID
      const counterInfo = await connection.getAccountInfo(counterPda);
      let currentCount = 0;
      
      if (!counterInfo) {
        // Counter not initialized - need to initialize via CLI first
        throw new Error(
          "Program not initialized. Please initialize the program first using the Solana CLI:\n\n" +
          "anchor run initialize\n\n" +
          "Or use the deployed program that's already initialized on Solana Devnet."
        );
      }
      
      currentCount = Number(counterInfo.data.readBigUInt64LE(0));
      
      const nextEscrowId = BigInt(currentCount + 1);
      
      // Find escrow PDA
      const [escrowPda] = PublicKey.findProgramAddressSync(
        [
          stringToUint8Array("escrow"),
          numberToLEBytes(nextEscrowId)
        ],
        PROGRAM_ID
      );

      // Parse addresses
      const beneficiaryPubkey = new PublicKey(formData.beneficiary);
      const approver1Pubkey = new PublicKey(formData.approver1);
      const approver2Pubkey = new PublicKey(formData.approver2);
      const approver3Pubkey = formData.approver3 ? new PublicKey(formData.approver3) : null;

      // Build instruction data using manual Borsh serialization
      const instructionData = serializeCreateEscrow(
        BigInt(Math.floor(amountInLamports)),
        beneficiaryPubkey.toBytes(),
        approver1Pubkey.toBytes(),
        approver2Pubkey.toBytes(),
        approver3Pubkey ? approver3Pubkey.toBytes() : null,
        formData.description
      );

      // Create instruction with correct account order (must match processor.rs)
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: creatorPubkey, isSigner: true, isWritable: true }, // creator
          { pubkey: escrowPda, isSigner: false, isWritable: true }, // escrow account
          { pubkey: counterPda, isSigner: false, isWritable: true }, // counter
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system program
        ],
        programId: PROGRAM_ID,
        data: instructionData as Buffer, // Use Uint8Array directly (cast for TS)
      });

      // Create transaction
      const transaction = new Transaction().add(instruction);
      transaction.feePayer = creatorPubkey;
      
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      // Sign and send transaction
      const signed = await walletProvider.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      
      // Confirm transaction
      await connection.confirmTransaction(signature, "confirmed");

      toast({
        title: "Escrow Created!",
        description: `Transaction: ${signature.slice(0, 8)}...`,
      });

      // Switch to escrows tab and reload
      setActiveTab("escrows");
      await loadEscrows(walletAddress);
      
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
    if (!walletAddress || !walletProvider) return;
    
    try {
      const connection = new Connection(SOLANA_RPC, "confirmed");
      const approverPubkey = new PublicKey(walletAddress);
      
      // Find the escrow account
      const escrowIdBigInt = BigInt(escrowId);
      const [escrowPda] = PublicKey.findProgramAddressSync(
        [
          stringToUint8Array("escrow"),
          numberToLEBytes(escrowIdBigInt)
        ],
        PROGRAM_ID
      );

      // Get escrow data to find beneficiary
      const escrowInfo = await connection.getAccountInfo(escrowPda);
      if (!escrowInfo) {
        throw new Error("Escrow not found");
      }

      console.log("Escrow PDA:", escrowPda.toBase58());
      console.log("Escrow owner:", escrowInfo.owner.toBase58());
      console.log("Escrow data length:", escrowInfo.data.length);

      const escrowData = parseEscrowData(escrowInfo.data, escrowId);
      if (!escrowData) {
        throw new Error("Could not parse escrow data");
      }

      console.log("Parsed escrow:", escrowData);
      console.log("Approver (current wallet):", walletAddress);
      console.log("Is approver1:", escrowData.approver1 === walletAddress);
      console.log("Is approver2:", escrowData.approver2 === walletAddress);

      const beneficiaryPubkey = new PublicKey(escrowData.beneficiary);

      console.log("\n=== Transaction Accounts ===");
      console.log("1. Approver:", approverPubkey.toBase58(), "(signer, writable)");
      console.log("2. Escrow:", escrowPda.toBase58(), "(writable)");
      console.log("3. Beneficiary:", beneficiaryPubkey.toBase58(), "(writable)");
      console.log("4. System Program:", SystemProgram.programId.toBase58());
      console.log("Program ID:", PROGRAM_ID.toBase58());

      // Build ApproveRelease instruction (enum discriminator = 2)
      const instructionData = new Uint8Array([2]); // ApproveRelease has no additional data
      console.log("Instruction data:", Array.from(instructionData));

      // Create instruction with correct account order (must match processor.rs)
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: approverPubkey, isSigner: true, isWritable: true }, // approver (writable for transaction fees)
          { pubkey: escrowPda, isSigner: false, isWritable: true }, // escrow account
          { pubkey: beneficiaryPubkey, isSigner: false, isWritable: true }, // beneficiary
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system program
        ],
        programId: PROGRAM_ID,
        data: instructionData as Buffer,
      });

      // Create transaction
      const transaction = new Transaction().add(instruction);
      transaction.feePayer = approverPubkey;
      
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      toast({
        title: "Approval Transaction",
        description: "Please approve the transaction in your wallet",
      });

      // Sign and send transaction
      const signed = await walletProvider.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      
      // Confirm transaction
      await connection.confirmTransaction(signature, "confirmed");

      toast({
        title: "Approval Submitted!",
        description: `Transaction: ${signature.slice(0, 8)}...`,
      });

      // Reload escrows to update UI
      await loadEscrows(walletAddress);
      
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
    if (!walletAddress || !walletProvider) return;
    
    try {
      const connection = new Connection(SOLANA_RPC, "confirmed");
      const creatorPubkey = new PublicKey(walletAddress);
      
      // Find the escrow account
      const escrowIdBigInt = BigInt(escrowId);
      const [escrowPda] = PublicKey.findProgramAddressSync(
        [
          stringToUint8Array("escrow"),
          numberToLEBytes(escrowIdBigInt)
        ],
        PROGRAM_ID
      );

      // Build CancelEscrow instruction (enum discriminator = 3)
      const instructionData = new Uint8Array([3]); // CancelEscrow has no additional data

      // Create instruction with correct account order (must match processor.rs)
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: creatorPubkey, isSigner: true, isWritable: true }, // creator
          { pubkey: escrowPda, isSigner: false, isWritable: true }, // escrow account
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system program
        ],
        programId: PROGRAM_ID,
        data: instructionData as Buffer,
      });

      // Create transaction
      const transaction = new Transaction().add(instruction);
      transaction.feePayer = creatorPubkey;
      
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      toast({
        title: "Cancellation Transaction",
        description: "Please approve the transaction in your wallet",
      });

      // Sign and send transaction
      const signed = await walletProvider.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      
      // Confirm transaction
      await connection.confirmTransaction(signature, "confirmed");

      toast({
        title: "Escrow Cancelled!",
        description: `Funds refunded. Transaction: ${signature.slice(0, 8)}...`,
      });

      // Reload escrows to update UI
      await loadEscrows(walletAddress);
      
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
              <div className="relative p-3 rounded-xl bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 animate-float">
                <img 
                  src={planetIcon} 
                  alt="Solana" 
                  className="h-8 w-8 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                  Solana Escrow
                </h1>
                <p className="text-sm text-muted-foreground">
                  Multi-signature escrows on Solana
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/50 px-3 py-2 rounded-lg backdrop-blur-sm border border-border/50">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span>Solana Devnet</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {!isConnected ? (
          <div className="max-w-md mx-auto">
            <SolanaWalletConnect
              onConnect={handleWalletConnect}
              onDisconnect={handleWalletDisconnect}
              isConnected={isConnected}
              address={walletAddress}
            />
            
            {/* Info Card */}
            <Card className="mt-6 border-purple-500/20 bg-purple-500/5">
              <CardContent className="pt-6">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">📝 Note:</p>
                  <p>
                    The Solana escrow program is deployed on Devnet at:
                  </p>
                  <p className="font-mono text-xs bg-background/50 p-2 rounded break-all">
                    {PROGRAM_ID.toString()}
                  </p>
                  <p className="text-xs">
                    View on{" "}
                    <a 
                      href={`https://explorer.solana.com/address/${PROGRAM_ID.toString()}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-500 hover:underline"
                    >
                      Solana Explorer
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
              <SolanaWalletConnect
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
                  <CreateSolanaEscrow
                    onCreateEscrow={handleCreateEscrow}
                    isCreating={isCreating}
                  />
                </TabsContent>

                <TabsContent value="escrows" className="space-y-6 animate-fade-in">
                  <Card className="card-gradient border-purple-500/30">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <List className="h-5 w-5 text-purple-500" />
                          My Escrows
                        </div>
                        <span className="text-sm font-normal text-muted-foreground">
                          {escrows.length} total
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SolanaEscrowList
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
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
        <div className="container mx-auto px-4 py-6 relative z-10">
          <div className="text-center text-sm text-muted-foreground space-y-3">
            <p>Solana multi-signature escrow powered by native Solana programs</p>
            <p className="mt-1">Deployed on Solana Devnet</p>
            <p className="mt-1 font-mono text-xs opacity-75">
              Program: {PROGRAM_ID.toString().slice(0, 8)}...{PROGRAM_ID.toString().slice(-8)}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SolanaEscrow;

