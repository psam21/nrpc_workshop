// src/services/claimStore.ts
import Database from "better-sqlite3";

export class ClaimStore {
    private db: Database.Database;

    constructor(dbFile: string = "./wallet.db") {
        this.db = new Database(dbFile);

        this.db.prepare(
            `CREATE TABLE IF NOT EXISTS claims (
        pubkey TEXT PRIMARY KEY,
        claimed_at INTEGER DEFAULT (strftime('%s','now'))
      )`
        ).run();
    }

    hasClaimed(pubkey: string): boolean {
        const row = this.db.prepare("SELECT pubkey FROM claims WHERE pubkey = ?").get(pubkey);
        return !!row;
    }

    markClaimed(pubkey: string): void {
        this.db.prepare("INSERT OR IGNORE INTO claims (pubkey) VALUES (?)").run(pubkey);
    }
}
