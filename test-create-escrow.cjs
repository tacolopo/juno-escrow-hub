const { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram } = require("@solana/web3.js");
const bip39 = require("bip39");
const { derivePath } = require("ed25519-hd-key");

const PROGRAM_ID = new PublicKey("EADvxHv8EgzTCxXXqRWZ4CZukSDChstfrY6x89qwJumG");
const RPC_URL = "https://api.devnet.solana.com";
const LAMPORTS_PER_SOL = 1000000000;

// Helper functions (copied from frontend)
const stringToUint8Array = (str) => {
  return new TextEncoder().encode(str);
};

const numberToLEBytes = (num) => {
  const arr = new Uint8Array(8);
  const view = new DataView(arr.buffer);
  view.setBigUint64(0, BigInt(num), true); // true = little endian
  return arr;
};

const serializeCreateEscrow = (
  amount,
  beneficiary,
  approver1,
  approver2,
  approver3,
  description
) => {
  const descBytes = stringToUint8Array(description);
  const descLen = new Uint8Array(4);
  new DataView(descLen.buffer).setUint32(0, descBytes.length, true); // little endian

  const parts = [
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

async function testCreateEscrow() {
  const mnemonic = process.argv[2];
  if (!mnemonic) {
    console.error("Please provide mnemonic as argument:");
    console.error('node test-create-escrow.cjs "your twelve word mnemonic phrase here"');
    process.exit(1);
  }

  const seed = await bip39.mnemonicToSeed(mnemonic);
  const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString("hex")).key;
  const creator = Keypair.fromSeed(derivedSeed);
  
  console.log("Creator wallet:", creator.publicKey.toBase58());

  const connection = new Connection(RPC_URL, "confirmed");

  // Use the same values as the frontend form
  const amountInSol = 0.1;
  const amountInLamports = amountInSol * LAMPORTS_PER_SOL;
  const beneficiary = "Dm2crMT3LZpcQ6MGCYq8PWRk1wPd3pMNnYstWzFdm6AJ";
  const approver1 = "G9MLBNSHjvjmZbnEeC3737KhSMddXdBFztn8GNV5uUeR";
  const approver2 = "Dm2crMT3LZpcQ6MGCYq8PWRk1wPd3pMNnYstWzFdm6AJ";
  const description = "Test";

  // Find counter PDA
  const [counterPda] = PublicKey.findProgramAddressSync(
    [stringToUint8Array("counter")],
    PROGRAM_ID
  );

  // Get counter to determine next escrow ID (same as frontend)
  const counterInfo = await connection.getAccountInfo(counterPda);
  let currentCount = 0;
  
  if (!counterInfo) {
    console.error("Counter not initialized!");
    process.exit(1);
  }
  
  currentCount = Number(counterInfo.data.readBigUInt64LE(0));
  console.log("Current counter:", currentCount);
  
  const nextEscrowId = BigInt(currentCount + 1);
  console.log("Next escrow ID:", nextEscrowId);
  
  // Find escrow PDA
  const [escrowPda] = PublicKey.findProgramAddressSync(
    [
      stringToUint8Array("escrow"),
      numberToLEBytes(nextEscrowId)
    ],
    PROGRAM_ID
  );

  console.log("Escrow PDA:", escrowPda.toBase58());

  // Parse addresses
  const beneficiaryPubkey = new PublicKey(beneficiary);
  const approver1Pubkey = new PublicKey(approver1);
  const approver2Pubkey = new PublicKey(approver2);

  // Build instruction data using manual Borsh serialization (same as frontend)
  const instructionData = serializeCreateEscrow(
    BigInt(Math.floor(amountInLamports)),
    beneficiaryPubkey.toBytes(),
    approver1Pubkey.toBytes(),
    approver2Pubkey.toBytes(),
    null, // no third approver
    description
  );

  console.log("Instruction data length:", instructionData.length);
  console.log("Instruction data:", Array.from(instructionData.slice(0, 20)), "...");

  // Create instruction with correct account order (same as frontend)
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: creator.publicKey, isSigner: true, isWritable: true }, // creator
      { pubkey: escrowPda, isSigner: false, isWritable: true }, // escrow account
      { pubkey: counterPda, isSigner: false, isWritable: true }, // counter
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system program
    ],
    programId: PROGRAM_ID,
    data: Buffer.from(instructionData),
  });

  console.log("\n=== Transaction Accounts ===");
  console.log("1. Creator:", creator.publicKey.toBase58(), "(signer, writable)");
  console.log("2. Escrow:", escrowPda.toBase58(), "(writable)");
  console.log("3. Counter:", counterPda.toBase58(), "(writable)");
  console.log("4. System Program:", SystemProgram.programId.toBase58());

  const transaction = new Transaction().add(instruction);
  transaction.feePayer = creator.publicKey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  console.log("\n=== Sending Transaction ===");
  try {
    const signature = await connection.sendTransaction(transaction, [creator], {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
    
    console.log("Transaction signature:", signature);
    console.log("Waiting for confirmation...");
    
    const confirmation = await connection.confirmTransaction(signature, "confirmed");
    
    if (confirmation.value.err) {
      console.error("Transaction failed:", confirmation.value.err);
      
      // Fetch transaction details for logs
      const tx = await connection.getTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      
      if (tx && tx.meta && tx.meta.logMessages) {
        console.log("\n=== Program Logs ===");
        tx.meta.logMessages.forEach(log => console.log(log));
      }
    } else {
      console.log("✅ Transaction succeeded!");
      console.log(`View on explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    }
  } catch (error) {
    console.error("\n❌ Transaction failed:");
    console.error(error);
    
    if (error.logs) {
      console.log("\n=== Program Logs ===");
      error.logs.forEach(log => console.log(log));
    }
  }
}

testCreateEscrow().catch(console.error);
