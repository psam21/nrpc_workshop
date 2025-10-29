import WebSocket from "ws";
// @ts-ignore
globalThis.WebSocket = WebSocket;

import {
  Event,
  Filter,
  finalizeEvent,
  nip19,
  nip44,
  SimplePool,
  UnsignedEvent,
} from "nostr-tools";
import { CONFIG } from "../config.js";
import {
  Methods,
  MethodSpecError,
  MethodSpecParam,
  MethodSpecReturn,
  NRPCParams,
} from "../registry.js";
import { signEvent } from "../utils.js";

export const pool = new SimplePool();

export class NostrService {
  private subs: any[] = [];
  private relays: string[];
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(relayUrls: string[]) {
    this.relays = relayUrls;
  }

  private async initRelays() {
    await Promise.all(this.relays.map((url) => pool.ensureRelay(url)));
  }
  async connect() {
    await this.initRelays();
    await this.subscribeRequests();

    // 💡 Publish Kind 0 metadata on startup
    await this.publishProfileMetadata();

    // 🔁 Periodically refresh subscriptions
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(async () => {
      try {
        console.log("[NostrService] heartbeat — refreshing subscriptions");
        await this.subscribeRequests();
        await this.logRelayStates();
      } catch (err) {
        console.error("[NostrService] heartbeat error", err);
      }
    }, 500 * 1000);
  }

  private async closeSubscriptions() {
    if (!this.subs?.length) return;
    await Promise.all(
      this.subs.map(async (s) => {
        try {
          s.close();
        } catch (err) {
          console.warn("[NostrService] error closing sub", err);
        }
      })
    );
    this.subs = [];
  }

  async publishProfileMetadata() {
    console.log(
      "[NostrService] Publishing Kind 0 metadata (NRPC advertisement)"
    );

    const npub = nip19.npubEncode(CONFIG.pubKeyHex);
    const tags: string[][] = [["t", "nrpc_server"]];

    // Optional extra advertising / service info
    if (CONFIG.relays?.length) {
      CONFIG.relays.forEach((r) => tags.push(["r", r]));
    }

    const content = JSON.stringify({
      name: CONFIG.serviceName,
      about: CONFIG.serviceAbout,
      picture: CONFIG.servicePicture || "https://example.com/logo.png",
      banner: CONFIG.serviceBanner || "https://example.com/banner.png",
      lud16: CONFIG.lud16 || "", // optional lightning address
      website: CONFIG.website || "",
      nip05: CONFIG.nip05 || "",
      tags, // optional: embed tags in content if you like
    });

    const event = await finalizeEvent(
      {
        kind: 0,
        content,
        tags,
        created_at: Math.floor(Date.now() / 1000),
      },
      nip19.decode(CONFIG.privKey as string).data as Uint8Array
    );

    pool.publish(this.relays, event);
    console.log(`[NostrService] Published metadata for ${npub}`);
  }

  private async logRelayStates() {
    for (const url of this.relays) {
      const relay = await pool.ensureRelay(url);
      console.log("[NostrService] relay state", url, relay.connected);
    }
  }

  async disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    await this.closeSubscriptions();
  }

  private async subscribeRequests() {
    const filter: Filter = {
      kinds: [CONFIG.kindRequest, CONFIG.giftWrapKind],
      "#p": [CONFIG.pubKeyHex],
    };
    await this.closeSubscriptions();

    const sub = pool.subscribeMany(this.relays, filter, {
      onevent: (event: Event) => this.handleRequestEvent(event),
      oneose: () => {
        /* End of stored events */
        console.log("Received eose from a relay");
      },
    });

    this.subs.push(sub);
    console.log("Total subs at this point:", JSON.stringify(this.subs));
  }

  private getRumorFromWrap(wrap: Event) {
    const sk = nip19.decode(CONFIG.privKey!).data as Uint8Array;
    const wrapConversationKey = nip44.getConversationKey(sk, wrap.pubkey);
    const seal = JSON.parse(
      nip44.decrypt(wrap.content, wrapConversationKey)
    ) as Event;
    const sealConversatioKey = nip44.getConversationKey(sk, seal.pubkey);
    const rumor = JSON.parse(nip44.decrypt(seal.content, sealConversatioKey));
    return rumor;
  }

  private async handleRequestEvent(event: Event) {
    let eventToProcess: (UnsignedEvent & { id: string }) | Event;
    let callerPubkey: string;
    if (event.kind === 22068) {
      eventToProcess = event;
      callerPubkey = event.pubkey;
    } else if (event.kind === 21169) {
      eventToProcess = this.getRumorFromWrap(event);
      callerPubkey = eventToProcess.pubkey;
    } else {
      return;
    }
    console.log("EVENT TO BE PROCESSED IS", JSON.stringify(eventToProcess));
    try {
      const pTags = eventToProcess.tags
        .filter((t) => t[0] === "p")
        .map((t) => t[1]);
      if (!pTags.includes(CONFIG.pubKeyHex)) return;

      const methodTag = eventToProcess.tags.find((t) => t[0] === "method");
      if (!methodTag)
        return this.publishError(event, 400, "missing method tag");
      const method = methodTag[1];
      const params: NRPCParams = {};
      for (const t of eventToProcess.tags)
        if (t[0] === "param") params[t[1]] = t[2] ?? "";
      console.log("METHODS ARE", Methods);
      if (!Methods.has(method))
        return this.publishError(event, 404, `method ${method} not found`);
      const handler = Methods.get(method)!;
      const result = await handler(params, eventToProcess as Event, {});
      if (Array.isArray(result) && result[0]?.name && result[0]?.handler) {
        // Special case: this is getMethods (MethodSpec[])
        const tags: string[][] = [
          ["e", event.id],
          ["p", event.pubkey],
          ["status", "200"],
        ];

        for (const method of result) {
          tags.push(["result", "method", method.name]);

          method.params?.forEach((p: MethodSpecParam) =>
            tags.push([
              "result",
              "param",
              method.name,
              p.name,
              p.type,
              p.required ? "required" : "optional",
            ])
          );

          method.returns?.forEach((r: MethodSpecReturn) =>
            tags.push(["result", "returns", method.name, r.name, r.type])
          );

          method.errors?.forEach((e: MethodSpecError) =>
            tags.push([
              "result",
              "error",
              method.name,
              String(e.code),
              e.message,
            ])
          );
        }

        const resp = await signEvent(
          { tags },
          eventToProcess.id,
          eventToProcess.kind === CONFIG.requestRumorKind,
          callerPubkey
        );
        console.log("RESPONDING WITH RESP", JSON.stringify(resp));
        pool.publish(this.relays, resp);
        return;
      }

      if (result === undefined) {
        const tags = [
          ["e", event.id],
          ["p", event.pubkey],
          ["status", "204"],
        ];
        const resp = await signEvent(
          { tags },
          eventToProcess.id,
          eventToProcess.kind === CONFIG.requestRumorKind,
          callerPubkey
        );
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
        const resp = await signEvent(
          { tags },
          eventToProcess.id,
          eventToProcess.kind === CONFIG.requestRumorKind,
          callerPubkey
        );
        pool.publish(this.relays, resp);
        return;
      }

      const tags = [
        ["e", event.id],
        ["p", event.pubkey],
        ["status", "200"],
        ["result", "value", String(result)],
      ];
      const resp = await signEvent(
        { tags },
        eventToProcess.id,
        eventToProcess.kind === CONFIG.requestRumorKind,
        callerPubkey
      );
      pool.publish(this.relays, resp);
      return;
    } catch (err: any) {
      console.error("handleRequestEvent error", err);
      this.publishError(eventToProcess, 500, String(err?.message || err));
      return;
    }
  }

  private async publishError(
    requestEvent: UnsignedEvent & { id: string },
    status: number,
    message: string
  ) {
    console.log("GOT REQUEST EVENT AS", requestEvent);
    const tags = [
      ["e", requestEvent.id],
      ["p", requestEvent.pubkey],
      ["status", String(status)],
      ["error", String(status), message],
    ];
    const resp = await signEvent(
      { tags },
      requestEvent.id,
      requestEvent.kind === CONFIG.requestRumorKind,
      requestEvent.pubkey
    );
    pool.publish(this.relays, resp);
    console.log("PUBLISHED ERROR EVENT", resp);
  }
}
