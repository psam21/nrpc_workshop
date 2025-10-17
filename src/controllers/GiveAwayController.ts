// src/controllers/GiveawayController.ts
import { BaseController } from "./BaseController.js";
import { MethodRegistry } from "../registry.js";
import { Event } from "nostr-tools";
import { GiveawayWalletService } from "../services/GiveAwayWalletService.js";
import { ClaimStore } from "../services/claimStore.js";
import { sendDirectMessage } from "../services/sendDM.js";

export class GiveawayController extends BaseController {
  private walletService: GiveawayWalletService;
  private claimStore: ClaimStore;

  constructor(registry: MethodRegistry, mintUrl: string) {
    super(registry);

    this.walletService = new GiveawayWalletService(mintUrl);
    this.claimStore = new ClaimStore();

    registry.register(
      "giveaway",
      async (params: Record<string, any>, event: Event) => {
        const nostrEvent = params["I want to receive ecash!"];
        try {
          const pubkey = JSON.parse(nostrEvent).pubkey
          // Check if already claimed
          if (this.claimStore.hasClaimed(pubkey)) {
            await sendDirectMessage(pubkey, "Sorry, only 1 ecash token per pubkey");
            console.log(`[GiveawayController] Pubkey ${pubkey} tried to claim again`);
            return { message: "Already claimed", pubkey };
          }

          // Send 1 sat token
          const token = await this.walletService.sendGiveaway(1);

          // Mark as claimed
          this.claimStore.markClaimed(pubkey);

          // Send DM
          const message = `🎁 Thank you for participating! Here's a small gift: ${token}`;
          await sendDirectMessage(pubkey, message);

          console.log(`[GiveawayController] Sent ecash to ${pubkey}`);

          // 🔹 Log remaining server balance
          const remainingBalance = this.walletService.getBalance();
          console.log(`[GiveawayController] Remaining server balance: ${remainingBalance} sats`);

          return { token, pubkey };
        } catch (err: any) {
          console.error("[GiveawayController] Error:", err);
          throw err;
        }
      },
      {
        params: [{ name: "I want to receive ecash!", type: "string", required: true }],
        returns: [
          { name: "token", type: "string" },
          { name: "pubkey", type: "string" },
          { name: "message", type: "string" },
        ],
        errors: [
          { code: 400, message: "Already claimed" },
          { code: 500, message: "Internal error" },
        ],
      }
    );
  }
}
