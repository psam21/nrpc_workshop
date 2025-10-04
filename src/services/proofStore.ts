// src/services/proofStore.ts
import Database from "better-sqlite3";
import { Proof } from "@cashu/cashu-ts";

type ProofRow = {
  id: string;
  mint: string;
  secret: string;
  amount: number;
  C: string;
  created_at?: number;
};

export class ProofStore {
  private db!: Database.Database;

  // Initialize the database and table
  init(dbFile: string = "./wallet.db") {
    this.db = new Database(dbFile);

    this.db
      .prepare(
        `CREATE TABLE IF NOT EXISTS proofs (
            id TEXT,
            mint TEXT NOT NULL,
            secret TEXT NOT NULL,
            amount INTEGER NOT NULL,
            C TEXT NOT NULL,
            created_at INTEGER DEFAULT (strftime('%s','now')),
            PRIMARY KEY (mint, secret, C)
          )`
      )
      .run();
  }

  // Save multiple proofs; duplicates are ignored
  saveProofs(proofs: Proof[], mint: string) {
    const stmt = this.db.prepare(
      `INSERT OR IGNORE INTO proofs (id, mint, secret, amount, C) 
       VALUES (@id, @mint, @secret, @amount, @C)`
    );

    const insertMany = this.db.transaction((ps: Proof[]) => {
      for (const p of ps) {
        stmt.run({
          id: p.id,
          secret: p.secret,
          amount: p.amount,
          C: p.C,
          mint, // attach mint manually
        });
      }
    });

    insertMany(proofs);
  }

  // Delete proofs by their IDs
  deleteProofs(proofs: Proof[], mint: string) {
    if (!proofs.length) return;

    const stmt = this.db.prepare(
      `DELETE FROM proofs WHERE mint = @mint AND secret = @secret AND C = @C`
    );

    const delMany = this.db.transaction((ps: Proof[]) => {
      for (const p of ps) {
        stmt.run({
          mint,
          secret: p.secret,
          C: p.C,
        });
      }
    });

    delMany(proofs);
  }

  // Load all proofs from the database
  loadProofs(): Proof[] {
    const rows = this.db.prepare<[], ProofRow>(`SELECT * FROM proofs`).all();
    console.log("PROOFS IN DB:");
    return rows.map((r) => ({
      id: r.id,
      mint: r.mint,
      secret: r.secret,
      amount: r.amount,
      C: r.C,
    }));
  }

  // Optional helper: get total balance
  getBalance(): number {
    const rows = this.db.prepare(`SELECT amount FROM proofs`).all();
    return rows.reduce((sum, r: any) => sum + r.amount, 0) as number;
  }
}
