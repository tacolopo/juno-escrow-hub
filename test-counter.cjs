const { Connection, PublicKey } = require("@solana/web3.js");

const PROGRAM_ID = new PublicKey("EADvxHv8EgzTCxXXqRWZ4CZukSDChstfrY6x89qwJumG");
const RPC_URL = "https://api.devnet.solana.com";

async function checkCounter() {
  const connection = new Connection(RPC_URL, "confirmed");
  
  // Find counter PDA
  const [counterPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("counter")],
    PROGRAM_ID
  );
  
  console.log("Counter PDA:", counterPda.toBase58());
  
  const info = await connection.getAccountInfo(counterPda);
  if (!info) {
    console.log("Counter not found!");
    return;
  }
  
  console.log("Counter account info:");
  console.log("  Owner:", info.owner.toBase58());
  console.log("  Data length:", info.data.length);
  console.log("  Lamports:", info.lamports);
  console.log("  Current count:", info.data.readBigUInt64LE(0));
  
  // Check if there are any escrow accounts
  console.log("\nChecking for existing escrows...");
  
  const count = Number(info.data.readBigUInt64LE(0));
  console.log("Expected escrow count:", count);
  
  for (let i = 1; i <= count && i <= 5; i++) {
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from([i, 0, 0, 0, 0, 0, 0, 0])],
      PROGRAM_ID
    );
    
    const escrowInfo = await connection.getAccountInfo(escrowPda);
    if (escrowInfo) {
      console.log(`  Escrow ${i}: ${escrowPda.toBase58()} (${escrowInfo.lamports} lamports)`);
    } else {
      console.log(`  Escrow ${i}: NOT FOUND`);
    }
  }
}

checkCounter().catch(console.error);
