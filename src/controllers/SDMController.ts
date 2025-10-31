import { NRPCParams, MethodRegistry } from "../registry.js";
import { BaseController } from "./BaseController.js";
import { Event, finalizeEvent, getPublicKey, nip04, nip19 } from "nostr-tools";
import { pool } from "../services/nostr.js";
import { CONFIG } from "../config.js";
import { sendDirectMessage } from "../services/sendDM.js";

export class SDMController extends BaseController {
  constructor(registry: MethodRegistry) {
    super(registry);

    registry.register("sendSecureDM", this.sendSecureDM.bind(this), {
      params: [
        { name: "Are you humble?", type: "string", required: true }
      ],
      errors: [
        { code: 400, message: "User is not humble" }
      ]
    });
  }

  async sendSecureDM(params: NRPCParams, event: Event) {
    console.log("Secure DM form submitted:", params);

    // Check if user is humble
    if (params["Are you humble?"] !== "Yes") {
      const err: any = new Error("User is not humble");
      err.status = 400;
      throw err;
    }

    // Send a DM to the form filler (event.pubkey)
    const thankYouMessage = "User is humble - Thank you for testing out secure messaging!";
    await sendDirectMessage(event.pubkey, thankYouMessage);

    // RPC response is just 200 OK, no results needed
    return { message: "User is humble" };
  }
}
