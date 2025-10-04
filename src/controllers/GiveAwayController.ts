// src/controllers/GiveawayController.ts
import { BaseController } from "./BaseController.js";
import { MethodRegistry } from "../registry.js";
import { Event } from "nostr-tools";
import {
  CashuWallet,
  CashuMint,
  getDecodedToken,
  getEncodedToken,
  Proof,
} from "@cashu/cashu-ts";
import { ProofStore } from "../services/proofStore.js";

export class GiveawayController extends BaseController {
  private wallet: CashuWallet;
  private proofStore: ProofStore;
  private mintUrl: string;
  private proofs: Proof[] = [];

  constructor(registry: MethodRegistry, mintUrl: string) {
    super(registry);

    this.mintUrl = mintUrl;
    this.proofStore = new ProofStore();
    const mint = new CashuMint(mintUrl);
    this.wallet = new CashuWallet(mint);

    registry.register("giveaway", this.giveaway.bind(this), {
      params: [{ name: "amount", type: "number", required: true }],
      returns: [{ name: "token", type: "string" }],
      errors: [
        { code: 400, message: "Insufficient funds" },
        { code: 500, message: "Internal error" },
      ],
    });
  }

  async giveaway(params: Record<string, any>, event: Event) {
    const amount = 10;
    this.proofStore.init();
    this.proofs = this.proofStore.loadProofs();
    console.log("Proofs loaded are", this.proofs);
    if (this.proofs.length === 0) {
      const err: any = new Error("Insufficient funds");
      err.status = 400;
      throw err;
    }

    const { send, keep } = await this.wallet.send(amount, this.proofs);

    if (send.length === 0) {
      const err: any = new Error("Insufficient funds");
      err.status = 400;
      throw err;
    }

    // Update wallet state
    this.proofs = [...keep];
    await this.proofStore.deleteProofs(send, "https://forge.flashapp.me");
    await this.proofStore.saveProofs(this.proofs, "https://forge.flashapp.me");

    const giveawayToken = getEncodedToken({ mint: this.mintUrl, proofs: send });

    console.log(
      `[GiveawayController] Gave away ${amount} sats to ${event.pubkey}`
    );

    return { token: giveawayToken };
  }
}
