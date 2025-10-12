import { Blockfrost, Lucid, fromText } from "lucid-cardano";
import fs from "fs";
import path from "path";

// Load the compiled Plutus script
const plutusJson = JSON.parse(fs.readFileSync("./plutus.json", "utf8"));
const validator = plutusJson.validators[0];

// Load wallet keys
const paymentSkey = JSON.parse(
  fs.readFileSync(path.join(process.env.HOME, "cardano-mainnet-keys/payment.skey"), "utf8")
);

async function deployContract() {
  console.log("🚀 CardanoScrow Aiken Contract Deployment");
  console.log("=========================================\n");

  // Initialize Lucid with Blockfrost (public mainnet API)
  console.log("📡 Connecting to Cardano mainnet via Blockfrost...");
  const lucid = await Lucid.new(
    new Blockfrost(
      "https://cardano-mainnet.blockfrost.io/api/v0",
      "mainnetFreeApiKeyForPublicUse" // Using free tier
    ),
    "Mainnet"
  );

  // Load wallet from private key
  console.log("🔐 Loading wallet...");
  const privateKey = paymentSkey.cborHex;
  lucid.selectWalletFromPrivateKey(privateKey);

  const address = await lucid.wallet.address();
  console.log(`✓ Wallet address: ${address}`);

  // Get UTXOs
  const utxos = await lucid.wallet.getUtxos();
  const balance = utxos.reduce((sum, utxo) => sum + BigInt(utxo.assets.lovelace || 0), 0n);
  console.log(`✓ Balance: ${Number(balance) / 1_000_000} ADA`);
  console.log(`✓ Available UTXOs: ${utxos.length}\n`);

  // Calculate script address
  console.log("📝 Calculating script address...");
  const scriptAddress = lucid.utils.validatorToAddress({
    type: "PlutusV2",
    script: validator.compiledCode,
  });
  console.log(`✓ Script address: ${scriptAddress}\n`);

  // Create a reference script output (deploy the script to chain)
  console.log("🔨 Building deployment transaction...");
  
  try {
    const tx = await lucid
      .newTx()
      .payToAddressWithData(
        scriptAddress,
        {
          inline: {
            constructor: 0,
            fields: [], // Initial datum for contract deployment
          },
        },
        { lovelace: 2_000_000n } // Min ADA for script UTXO
      )
      .complete();

    console.log("✓ Transaction built");
    console.log(`  Fee: ${Number(tx.fee) / 1_000_000} ADA`);
    console.log(`  Size: ${tx.txSigned.to_bytes().length} bytes\n`);

    console.log("✍️  Signing transaction...");
    const signedTx = await tx.sign().complete();
    console.log("✓ Transaction signed\n");

    console.log("📤 Submitting to mainnet...");
    const txHash = await signedTx.submit();
    
    console.log("\n✅ CONTRACT DEPLOYED SUCCESSFULLY!");
    console.log("=====================================");
    console.log(`\n🎉 Transaction Hash: ${txHash}`);
    console.log(`🔍 View on Cardanoscan: https://cardanoscan.io/transaction/${txHash}`);
    console.log(`📍 Script Address: ${scriptAddress}`);
    console.log(`\n💾 Contract deployed at: ${new Date().toISOString()}`);

    // Save deployment info
    const deploymentInfo = {
      txHash,
      scriptAddress,
      validatorHash: lucid.utils.validatorToScriptHash({
        type: "PlutusV2",
        script: validator.compiledCode,
      }),
      deployedAt: new Date().toISOString(),
      network: "mainnet",
    };
    
    fs.writeFileSync(
      "./deployment-info.json",
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log(`\n📄 Deployment info saved to deployment-info.json`);

  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    if (error.message.includes("InputsExhaustedError")) {
      console.error("\n💡 Insufficient funds. Please add more ADA to your wallet.");
    }
    process.exit(1);
  }
}

// Run deployment
deployContract().catch(console.error);

