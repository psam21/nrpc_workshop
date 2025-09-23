/*
Updated NostrService using nostr-tools SimplePool (modern API)
Project layout remains the same (src/controllers, src/services, etc.)
*/

// ---------------------------
// src/services/nostr.ts
// ---------------------------
import { Event, Filter, SimplePool } from "nostr-tools";
import { CONFIG } from "../config.js";
import { Methods, NRPCParams } from "../registry.js";
import { signEvent, assertServerKeys } from "../utils.js";
import WebSocket from "ws";

export const pool = new SimplePool();

// @ts-ignore
globalThis.WebSocket = WebSocket;

export class NostrService {
  private subs: any[] = [];
  private relays: string[];

  constructor(relayUrls: string[]) {
    relayUrls.forEach((url) => pool.ensureRelay(url));
    this.relays = relayUrls;
  }

  async connect() {
    assertServerKeys();
    this.subscribeRequests();
  }

  private subscribeRequests() {
    const filter: Filter = {
      kinds: [CONFIG.kindRequest],
      "#p": [CONFIG.pubKeyHex],
    };

    const sub = pool.subscribeMany(this.relays, [filter], {
      onevent: (event: Event) => this.handleRequestEvent(event),
      oneose: () => {
        /* End of stored events */
      },
    });

    this.subs.push(sub);
  }

  private async handleRequestEvent(event: Event) {
    try {
      const pTags = event.tags.filter((t) => t[0] === "p").map((t) => t[1]);
      if (!pTags.includes(CONFIG.pubKeyHex)) return;

      const methodTag = event.tags.find((t) => t[0] === "method");
      if (!methodTag)
        return this.publishError(event, 400, "missing method tag");
      const method = methodTag[1];

      const params: NRPCParams = {};
      for (const t of event.tags)
        if (t[0] === "param") params[t[1]] = t[2] ?? "";

      if (!Methods.has(method))
        return this.publishError(event, 404, `method ${method} not found`);

      const handler = Methods.get(method)!;
      const result = await handler(params, event, {});

      if (result === undefined) {
        const tags = [
          ["e", event.id],
          ["p", event.pubkey],
          ["status", "204"],
        ];
        const resp = await signEvent({ tags });
        pool.publish(this.relays, resp);
        return;
      }

      if (typeof result === "object") {
        const tags = [
          ["e", event.id],
          ["p", event.pubkey],
          ["status", "200"],
          ["result_json", JSON.stringify(result)],
        ];
        const resp = await signEvent({ tags });
        await pool.publish(this.relays, resp);
        return;
      }

      const tags = [
        ["e", event.id],
        ["p", event.pubkey],
        ["status", "200"],
        ["result", "value", String(result)],
      ];
      const resp = await signEvent({ tags });
      await pool.publish(this.relays, resp);
    } catch (err: any) {
      console.error("handleRequestEvent error", err);
      this.publishError(event, 500, String(err?.message || err));
    }
  }

  private async publishError(
    requestEvent: Event,
    status: number,
    message: string
  ) {
    const tags = [
      ["e", requestEvent.id],
      ["p", requestEvent.pubkey],
      ["status", String(status)],
      ["error", String(status), message],
    ];
    const resp = await signEvent({ tags });
    pool.publish(this.relays, resp);
    console.log("PUBLISHED ERROR EVENT", resp);
  }
}
