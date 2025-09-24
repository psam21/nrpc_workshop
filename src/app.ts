// Catch unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "\nReason:", reason);
});

// Catch uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// Optional: log when process is about to exit
process.on("exit", (code) => {
  console.log("Process exiting with code:", code);
});

import "dotenv/config";

import { CONFIG } from "./config.js";
import { Methods as Registry } from "./registry.js";
import { ReminderController } from "./controllers/ReminderController.js";
import { NostrService } from "./services/nostr.js";
import { assertServerKeys } from "./utils.js";
import { DMController } from "./controllers/DMController.js";

async function main() {
  try {
    assertServerKeys();
  } catch (err: any) {
    console.error(err);
    process.exit(1);
  }

  new ReminderController(Registry);
  new DMController(Registry);

  const nostr = new NostrService(CONFIG.relays);
  await nostr.connect();
}

main().catch((err) => {
  console.error(err);
});
