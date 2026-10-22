/**
 * Title: GameFund Automagic Foundry Sync Engine
 * Purpose: Parses build broadcast receipts from Foundry scripts and distributes
 *          live deployment addresses straight to web environments and ingestion layers.
 */

import * as fs from "fs";
import * as path from "path";

// Update this to match your actual deploy script name and local chain ID (e.g., 31337 for Anvil)
const BROADCAST_LOG_PATH = path.join(
  __dirname,
  "../packages/contracts/broadcast/Deploy.s.sol/31337/run-latest.json",
);
const WEB_ENV_PATH = path.join(__dirname, "../apps/web/.env.development");
const INDEXER_ENV_PATH = path.join(
  __dirname,
  "../services/indexer/.env.development",
);

function synchronizeWorkspaceEnvironments() {
  console.log(
    "[SYNC] Initiating cross-layer environment sync routine via Foundry...",
  );

  // 1. Verify broadcast data exists before parsing
  if (!fs.existsSync(BROADCAST_LOG_PATH)) {
    console.error(
      `[ERROR] Broadcast file missing at path: ${BROADCAST_LOG_PATH}. Please execute a broadcast script first.`,
    );
    process.exit(1);
  }

  // 2. Parse the latest run file to find contract deployments
  const broadcastData = JSON.parse(fs.readFileSync(BROADCAST_LOG_PATH, "utf8"));

  // Find the transaction that created a contract (where transactionType is "CREATE")
  const creationTx = broadcastData.transactions.find(
    (tx: any) => tx.transactionType === "CREATE",
  );

  if (!creationTx || !creationTx.contractAddress) {
    console.error(
      "[ERROR] Could not find a contract deployment address in run-latest.json.",
    );
    process.exit(1);
  }

  const deployedAddress = creationTx.contractAddress;
  console.log(
    `[SYNC] Extracted active contract address target: ${deployedAddress}`,
  );

  // 3. Generate updated environment payloads for web frontend context
  const webEnvContent = `VITE_PUBLIC_GAMEFUND_CONTRACT_ADDRESS=${deployedAddress}\nVITE_API_BASE_URL=http://localhost:8000\n`;
  fs.writeFileSync(WEB_ENV_PATH, webEnvContent, { encoding: "utf8" });
  console.log(
    `[SUCCESS] Web environment context injected cleanly at: ${WEB_ENV_PATH}`,
  );

  // 4. Mirror configuration parameters directly to ingestion layers
  const indexerEnvContent = `BLOCKCHAIN_RPC_WS_URL=ws://127.0.0.1:8545\nTARGET_ROUTER_ADDRESS=${deployedAddress}\n`;
  fs.writeFileSync(INDEXER_ENV_PATH, indexerEnvContent, { encoding: "utf8" });
  console.log(
    `[SUCCESS] Event indexer configurations synchronized cleanly at: ${INDEXER_ENV_PATH}`,
  );
}

synchronizeWorkspaceEnvironments();
