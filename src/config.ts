export const CONFIG = {
  privKey: process.env.NSEC,
  pubKeyHex: process.env.PUBKEY || "",
  relays: (process.env.RELAYS && process.env.RELAYS.split(",")) || [
    "wss://relay.damus.io",
    "wss://relay.snort.social",
  ],
  kindRequest: 22068,
  giftWrapKind: 21169,
  requestRumorKind: 68,
  responseRumorKind: 69,
  kindResponse: 22069,
  httpPort: Number(process.env.PORT) || 3000,
};
