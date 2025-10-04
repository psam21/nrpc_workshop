import "dotenv/config";
import { CashuWallet, CashuMint, getDecodedToken } from "@cashu/cashu-ts";
import { ProofStore } from "../services/proofStore.js";

async function seedWallet(token: string) {
  const mintUrl = "https://forge.flashapp.me";
  const mint = new CashuMint(mintUrl);
  const wallet = new CashuWallet(mint);
  const store = new ProofStore();
  store.init("./wallet.db");

  const decoded = getDecodedToken(token);
  const proofs = await wallet.receive(decoded);
  console.log("Proofs are", JSON.stringify(proofs));
  store.saveProofs(proofs, "https://forge.flashapp.me");
  console.log(
    `Seeded wallet with ${proofs.length} proofs, total sats: ${proofs.reduce(
      (a, p) => a + p.amount,
      0
    )}`
  );
}

console.log("ECASH TOKEN IS", process.env);

const token = process.env.ECASH_TOKEN;
if (!token) throw new Error("No token provided");
seedWallet(token);
