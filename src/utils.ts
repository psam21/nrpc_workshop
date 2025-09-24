import {
  Event,
  getPublicKey,
  nip19,
  finalizeEvent,
  UnsignedEvent,
  nip44,
  generateSecretKey,
  getEventHash,
} from "nostr-tools";
import { CONFIG } from "./config.js";

export function hexToNpub(hex: string) {
  return nip19.npubEncode(hex);
}

export function assertServerKeys() {
  //console.log("PRIVATE KEY IS", CONFIG.privKey, CONFIG);
  if (!CONFIG.privKey) {
    throw new Error("Server private key missing or invalid.");
  }
  if (!CONFIG.pubKeyHex)
    CONFIG.pubKeyHex = getPublicKey(
      nip19.decode(CONFIG.privKey).data as Uint8Array
    );
}

function createWrap(
  event: UnsignedEvent & { id: string },
  rumorId: string,
  callerPubkey: string
) {
  const now = Math.floor(Date.now() / 1000);
  const sk = nip19.decode(CONFIG.privKey!).data as Uint8Array;
  const sealConversatioKey = nip44.getConversationKey(sk, callerPubkey);
  const seal = {
    kind: 25,
    content: nip44.encrypt(JSON.stringify(event), sealConversatioKey),
    tags: [],
    pubkey: getPublicKey(sk),
    created_at: now,
  };
  const signedSeal = finalizeEvent(seal, sk);
  const ephemeralKey = generateSecretKey();
  const wrapConversationKey = nip44.getConversationKey(
    ephemeralKey,
    callerPubkey
  );
  const wrap = {
    kind: CONFIG.giftWrapKind,
    content: nip44.encrypt(JSON.stringify(signedSeal), wrapConversationKey),
    pubkey: getPublicKey(ephemeralKey),
    tags: [["e", rumorId]],
    created_at: now,
  };
  const wrapEvent = finalizeEvent(wrap, ephemeralKey);
  return wrapEvent;
}

export async function signEvent(
  event: Partial<Event>,
  rumorId: string,
  encrypted: boolean,
  callerPubkey: string
): Promise<Event> {
  assertServerKeys();
  const now = Math.floor(Date.now() / 1000);
  let e: any = {
    kind: encrypted ? CONFIG.responseRumorKind : CONFIG.kindResponse,
    pubkey: CONFIG.pubKeyHex,
    created_at: event.created_at ?? now,
    tags: event.tags ?? [],
    content: event.content ?? "",
  };
  e.id = getEventHash(e);
  let finalEvent: Event | null = null;
  if (!encrypted)
    finalEvent = finalizeEvent(
      e,
      nip19.decode(CONFIG.privKey || "").data as Uint8Array
    );
  else {
    finalEvent = createWrap(
      e as UnsignedEvent & { id: string },
      rumorId,
      callerPubkey
    );
  }
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
