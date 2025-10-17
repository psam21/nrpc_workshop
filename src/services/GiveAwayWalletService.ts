// src/services/giveawayWalletService.ts
import { CashuWallet, CashuMint, getEncodedToken, Proof } from "@cashu/cashu-ts";
import { ProofStore } from "./proofStore.js";

export class GiveawayWalletService {
    private wallet: CashuWallet;
    private proofStore: ProofStore;
    private mintUrl: string;
    private proofs: Proof[] = [];

    constructor(mintUrl: string) {
        this.mintUrl = mintUrl;
        this.proofStore = new ProofStore();
        const mint = new CashuMint(mintUrl);
        this.wallet = new CashuWallet(mint);
        this.proofStore.init();
        this.reloadProofs();
    }

    reloadProofs() {
        this.proofs = this.proofStore.loadProofs();
    }

    getBalance(): number {
        return this.proofStore.getBalance();
    }

    /**
     * Sends a giveaway token of a specified amount.
     * Updates local DB state accordingly.
     */
    async sendGiveaway(amount: number): Promise<string> {
        this.reloadProofs();

        if (this.proofs.length === 0 || this.getBalance() < amount) {
            throw Object.assign(new Error("Insufficient funds"), { status: 400 });
        }
        const selectedProofs = this.wallet.selectProofsToSend(this.proofs, amount);

        const { send, keep } = await this.wallet.send(amount, selectedProofs.send);

        if (send.length === 0) {
            throw Object.assign(new Error("Insufficient funds"), { status: 400 });
        }

        // Update wallet state
        console.log("Deleting proofs:", send);
        console.log("Keeping proofs:", keep);
        this.proofStore.deleteProofs(selectedProofs.send, this.mintUrl);
        this.proofStore.saveProofs(keep, this.mintUrl);
        this.proofs = [...keep];

        // Encode new giveaway token
        return getEncodedToken({ mint: this.mintUrl, proofs: send });
    }
}
