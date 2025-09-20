console.log("PROCESS ENV IS", process.env);

export const CONFIG = {
  privKey: process.env.NSEC,
  pubKeyHex: process.env.PUBKEY || "",
  relays: (process.env.RELAYS && process.env.RELAYS.split(",")) || [
    "wss://relay.damus.io",
    "wss://relay.snort.social",
  ],
  kindRequest: 22068,
  kindResponse: 22069,
  httpPort: Number(process.env.PORT) || 3000,
};
