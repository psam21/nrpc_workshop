import { NRPCParams, MethodRegistry } from "../registry.js";
import { BaseController } from "./BaseController.js";
import { Event, finalizeEvent, getPublicKey, nip04, nip19 } from "nostr-tools";
import { pool } from "../services/nostr.js";
import { CONFIG } from "../config.js";

export class DMController extends BaseController {
  constructor(registry: MethodRegistry) {
    super(registry);

    registry.register("sendDM", this.sendDM.bind(this));
  }

  async sendDM(params: NRPCParams, event: Event) {
    console.log("Form submitted:", params);

    // Send a DM to the form filler (event.pubkey)
    const thankYouMessage = "Thank you for testing out formstr!";
    await this.sendDirectMessage(event.pubkey, thankYouMessage);

    // RPC response is just 200 OK, no results needed
    return {};
  }

  private async sendDirectMessage(pubkey: string, message: string) {
    if (!CONFIG.privKey) throw Error("Server has no private key");
    const sk = nip19.decode(CONFIG.privKey).data as Uint8Array;
    const pk = getPublicKey(sk);

    // Encrypt content for recipient
    const encrypted = nip04.encrypt(sk, pubkey, message);

    const dmEvent = {
      kind: 4,
      pubkey: pk,
      created_at: Math.floor(Date.now() / 1000),
      tags: [["p", pubkey]],
      content: encrypted,
    };
    const finalEvent = finalizeEvent(dmEvent, sk);

    Promise.allSettled(pool.publish(CONFIG.relays, finalEvent)).then(
      (result: any) => {
        console.log(`Sent DM to ${pubkey}, ${result}`);
      }
    );
  }
}
