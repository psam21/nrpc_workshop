import {
  Event,
  getPublicKey,
  nip19,
  finalizeEvent,
  UnsignedEvent,
} from "nostr-tools";
import { CONFIG } from "./config.js";

export function hexToNpub(hex: string) {
  return nip19.npubEncode(hex);
}

export function assertServerKeys() {
  console.log("PRIVATE KEY IS", CONFIG.privKey, CONFIG);
  if (!CONFIG.privKey) {
    throw new Error("Server private key missing or invalid.");
  }
  if (!CONFIG.pubKeyHex)
    CONFIG.pubKeyHex = getPublicKey(
      nip19.decode(CONFIG.privKey).data as Uint8Array
    );
}

export async function signEvent(event: Partial<Event>): Promise<Event> {
  assertServerKeys();
  const now = Math.floor(Date.now() / 1000);
  const e: UnsignedEvent = {
    kind: event.kind ?? CONFIG.kindResponse,
    pubkey: CONFIG.pubKeyHex,
    created_at: event.created_at ?? now,
    tags: event.tags ?? [],
    content: event.content ?? "",
  };
  const finalEvent = finalizeEvent(
    e,
    nip19.decode(CONFIG.privKey || "").data as Uint8Array
  );
  return finalEvent;
}

export function generateId(length = 6): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
