import fs from "fs";
import { spawn } from "child_process";
import path from "path";

const logFile = path.resolve("output.log");
const pidFile = path.resolve("nrpc.pid");

// --- Daemonize mode ---
if (process.argv.includes("-d")) {
  const out = fs.openSync(logFile, "a");
  const err = fs.openSync(logFile, "a");

  const subprocess = spawn(process.execPath, process.argv.slice(1).filter(a => a !== "-d"), {
    detached: true,
    stdio: ["ignore", out, err],
  });

  subprocess.unref();

  // Write child PID to pid file
  fs.writeFileSync(pidFile, String(subprocess.pid));
  console.log(`NRPC server daemonized (PID ${subprocess.pid})`);
  console.log(`Logs: ${logFile}`);
  console.log(`PID file: ${pidFile}`);
  process.exit(0);
}

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
import { SDMController } from "./controllers/SDMController.js";
import { ErrorController } from "./controllers/ErrorController.js";
import { GiveawayController } from "./controllers/GiveAwayController.js";
import { SchedulePostController } from "./controllers/SchedulePostController.js";

async function main() {
  try {
    assertServerKeys();
  } catch (err: any) {
    console.error(err);
    process.exit(1);
  }

  new ReminderController(Registry);
  new DMController(Registry);
  new SDMController(Registry);
  new ErrorController(Registry);
  if (CONFIG.mintUrl) {
    new GiveawayController(Registry, CONFIG.mintUrl);
  }
  new SchedulePostController(Registry)

  const nostr = new NostrService(CONFIG.relays);
  await nostr.connect();
  console.log("NRPC server started and connected to relays.");

  // 👇 Keep process alive indefinitely
  setInterval(() => { }, 1 << 30);
}

main().catch((err) => {
  console.log("Caught an error",err);
});
