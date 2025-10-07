import Database from "better-sqlite3";

export interface Reminder {
  id: string;
  time: string;
  date: string;
  text: string;
  owner: string;
  scheduled_at: number;
}

const db = new Database("./reminders.db");
db.pragma("journal_mode = WAL");

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    time TEXT NOT NULL,
    date TEXT NOT NULL,
    text TEXT NOT NULL,
    owner TEXT NOT NULL,
    scheduled_at INTEGER NOT NULL
  )
`
).run();

export const ReminderDB = {
  insert(reminder: Reminder) {
    db.prepare(
      `INSERT INTO reminders (id, time, date, text, owner, scheduled_at)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      reminder.id,
      reminder.time,
      reminder.date,
      reminder.text,
      reminder.owner,
      reminder.scheduled_at
    );
  },

  delete(id: string) {
    db.prepare(`DELETE FROM reminders WHERE id = ?`).run(id);
  },

  getFutureReminders(now: number) {
    return db
      .prepare(
        `SELECT id, text, owner, scheduled_at FROM reminders WHERE scheduled_at > ?`
      )
      .all(now);
  },
};
