import { NRPCParams, MethodRegistry } from "../registry.js";
import { BaseController } from "./BaseController.js";
import { Event, finalizeEvent, getPublicKey, nip04, nip19 } from "nostr-tools";
import { pool } from "../services/nostr.js";
import { CONFIG } from "../config.js";
import { sendDirectMessage } from "../services/sendDM.js";

export class DMController extends BaseController {
  constructor(registry: MethodRegistry) {
    super(registry);

    registry.register("sendDM", this.sendDM.bind(this));
  }

  async sendDM(params: NRPCParams, event: Event) {
    console.log("Form submitted:", params);

    // Send a DM to the form filler (event.pubkey)
    const thankYouMessage = "Thank you for testing out formstr!";
    await sendDirectMessage(event.pubkey, thankYouMessage);

    // RPC response is just 200 OK, no results needed
    return {};
  }
}
