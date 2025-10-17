// src/controllers/GiveawayController.ts
import { BaseController } from "./BaseController.js";
import { MethodRegistry } from "../registry.js";
import { Event } from "nostr-tools";
import { GiveawayWalletService } from "../services/GiveAwayWalletService.js";
import { sendDirectMessage } from "../services/sendDM.js";

export class GiveawayController extends BaseController {
  private walletService: GiveawayWalletService;

  constructor(registry: MethodRegistry, mintUrl: string) {
    super(registry);
    this.walletService = new GiveawayWalletService(mintUrl);

    registry.register("giveaway", this.giveaway.bind(this), {
      params: [{ name: "amount", type: "number", required: false }],
      returns: [{ name: "token", type: "string" }],
      errors: [
        { code: 400, message: "Insufficient funds" },
        { code: 500, message: "Internal error" },
      ],
    });
  }

  async giveaway(params: Record<string, any>, event: Event) {
    const amount = Number(params.amount ?? 1);

    const giveawayToken = await this.walletService.sendGiveaway(amount);

    const message = `🎁 Thank you for participating! Here's a ${amount} sat gift from formstr:\n\n${giveawayToken}`;
    await sendDirectMessage(event.pubkey, message);

    console.log(`[GiveawayController] Gave away ${amount} sats to ${event.pubkey}`);

    return { token: giveawayToken };
  }
}
