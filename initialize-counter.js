const { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram } = require("@solana/web3.js");
const bip39 = require("bip39");
const { derivePath } = require("ed25519-hd-key");

const PROGRAM_ID = new PublicKey("6SNTMQNouzKgBZiweGJ82cMQKNDARFWKDoYeKiqBWTSv");
const RPC_URL = "https://api.devnet.solana.com";

const stringToUint8Array = (str) => {
  return new TextEncoder().encode(str);
};

async function initializeCounter() {
  const mnemonic = process.argv[2];
  if (!mnemonic) {
    console.error("Please provide mnemonic as argument:");
    console.error('node initialize-counter.js "your twelve word mnemonic phrase here"');
    process.exit(1);
  }

  const seed = await bip39.mnemonicToSeed(mnemonic);
  const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString("hex")).key;
  const authority = Keypair.fromSeed(derivedSeed);
  
  console.log("Authority wallet:", authority.publicKey.toBase58());

  const connection = new Connection(RPC_URL, "confirmed");

  // Find counter PDA
  const [counterPda] = PublicKey.findProgramAddressSync(
    [stringToUint8Array("counter")],
    PROGRAM_ID
  );

  console.log("Counter PDA:", counterPda.toBase58());

  // Create initialize instruction (discriminator 0)
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: authority.publicKey, isSigner: true, isWritable: true }, // authority
      { pubkey: counterPda, isSigner: false, isWritable: true }, // counter
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system program
    ],
    programId: PROGRAM_ID,
    data: Buffer.from([0]), // Initialize instruction discriminator
  });

  console.log("\n=== Initializing Counter ===");
  console.log("1. Authority:", authority.publicKey.toBase58(), "(signer, writable)");
  console.log("2. Counter:", counterPda.toBase58(), "(writable)");
  console.log("3. System Program:", SystemProgram.programId.toBase58());

  const transaction = new Transaction().add(instruction);
  transaction.feePayer = authority.publicKey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  console.log("\n=== Sending Transaction ===");
  try {
    const signature = await connection.sendTransaction(transaction, [authority], {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
    
    console.log("Transaction signature:", signature);
    console.log("Waiting for confirmation...");
    
    const confirmation = await connection.confirmTransaction(signature, "confirmed");
    
    if (confirmation.value.err) {
      console.error("Transaction failed:", confirmation.value.err);
    } else {
      console.log("✅ Counter initialized successfully!");
      console.log(`View on explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    }
  } catch (error) {
    console.error("\n❌ Transaction failed:");
    console.error(error);
  }
}

initializeCounter().catch(console.error);
