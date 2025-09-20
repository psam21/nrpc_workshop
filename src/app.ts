import "dotenv/config";

import { CONFIG } from "./config.js";
import { Methods as Registry } from "./registry.js";
import { ReminderController } from "./controllers/ReminderController.js";
import { NostrService } from "./services/nostr.js";
import { assertServerKeys } from "./utils.js";

async function main() {
  try {
    assertServerKeys();
  } catch (err: any) {
    console.error(err);
    process.exit(1);
  }

  new ReminderController(Registry);

  const nostr = new NostrService(CONFIG.relays);
  await nostr.connect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
