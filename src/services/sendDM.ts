import { finalizeEvent, getPublicKey, nip04, nip19 } from "nostr-tools";
import { CONFIG } from "../config.js";
import { pool } from "./nostr.js";

export async function sendDirectMessage(pubkey: string, message: string) {
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
