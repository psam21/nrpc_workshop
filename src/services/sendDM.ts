import {
  getPublicKey,
  finalizeEvent,
  generateSecretKey,
  nip19,
  nip44,
  nip04,
  getEventHash,
  EventTemplate,
  UnsignedEvent,
} from "nostr-tools";
import { CONFIG } from "../config.js";
import { pool } from "./nostr.js";

const TWO_HOURS = 2 * 60 * 60;
const now = () => Math.floor(Date.now() / 1000);
const randomNow = () => Math.floor(now() - Math.random() * TWO_HOURS);

/**
 * Send a NIP-17 DM (gift wrapped). Falls back to NIP-04 if recipient not ready.
 */
export async function sendDirectMessage(pubkey: string, message: string) {
  if (!CONFIG.privKey) throw new Error("Server has no private key");

  const senderSk = nip19.decode(CONFIG.privKey).data as Uint8Array;
  const senderPk = getPublicKey(senderSk);

  //
  // 1️⃣ Try to find recipient’s preferred relay list (kind 10050)
  //
  const relayList = await pool.querySync(CONFIG.relays,
    { kinds: [10050], authors: [pubkey] });
  let targetRelays: string[] = [];

  if (relayList.length > 0) {
    targetRelays = relayList[0].tags
      .filter(([t]) => t === "relay")
      .map(([, r]) => r);
  }

  //
  // 2️⃣ If no NIP-17 relay list → fallback to legacy NIP-04 DM
  //
  if (targetRelays.length === 0) {
    console.warn(
      `Recipient ${pubkey} has no kind:10050 relay list — using NIP-04 fallback`
    );

    const encrypted = await nip04.encrypt(senderSk, pubkey, message);
    const dmEvent = finalizeEvent(
      {
        kind: 4,
        created_at: now(),
        tags: [["p", pubkey]],
        content: encrypted,
      },
      senderSk
    );

    await Promise.allSettled(pool.publish(CONFIG.relays, dmEvent));
    console.log(`Sent NIP-04 DM to ${pubkey}`);
    return;
  }

  //
  // 3️⃣ Create rumor (unsigned kind 14)
  //
  let rumor: UnsignedEvent & { id: string } = {
    kind: 14,
    pubkey: senderPk,
    created_at: now(),
    tags: [["p", pubkey]],
    content: message,
    id: ""
  };
  rumor.id = getEventHash(rumor);

  //
  // 4️⃣ Create seal (kind 13, same created_at as rumor)
  //
  const sealed = finalizeEvent(
    {
      kind: 13,
      content: nip44.v2.encrypt(
        JSON.stringify(rumor),
        nip44.v2.utils.getConversationKey(senderSk, pubkey)
      ),
      tags: [],
      created_at: rumor.created_at,
    },
    senderSk
  );

  //
  // 5️⃣ Gift wrap (kind 1059, random created_at)
  //
  const ephemeralSk = generateSecretKey();
  const wrapped = finalizeEvent(
    {
      kind: 1059,
      content: nip44.v2.encrypt(
        JSON.stringify(sealed),
        nip44.v2.utils.getConversationKey(ephemeralSk, pubkey)
      ),
      tags: [["p", pubkey]],
      created_at: randomNow(),
    },
    ephemeralSk
  );

  //
  // 6️⃣ Publish to recipient’s preferred relays
  //
  Promise.allSettled(pool.publish(targetRelays, wrapped)).then((result: any) =>
    console.log(`Sent NIP-17 DM to ${pubkey}, ${JSON.stringify(result)}`)
  );
}
