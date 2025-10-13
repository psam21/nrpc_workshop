import { ReminderDB, Reminder } from "../db/reminder.js";
import { sendDirectMessage } from "./sendDM.js";
import { NostrService, pool } from "./nostr.js";
import { Event } from "nostr-tools";
import { CONFIG } from "../config.js";

/**
 * Generic job structure
 */
export interface BaseJob {
  id: string;
  type: "reminder" | "post";
  scheduled_at: number;
  payload: any;
}

export interface ReminderJob extends BaseJob {
  type: "reminder";
  payload: Reminder;
}

export interface PostJob extends BaseJob {
  type: "post";
  payload: Event;
}

export type Job = ReminderJob | PostJob;

export class SchedulerService {
  static schedule(job: Job) {
    const delay = job.scheduled_at - Date.now();

    if (delay <= 0) {
      console.warn(`[Scheduler] Skipping past job ${job.id} (${job.type})`);
      return;
    }

    console.log(
      `[Scheduler] Scheduling ${job.type} job ${job.id} in ${delay}ms`
    );

    setTimeout(async () => {
      try {
        switch (job.type) {
          case "reminder": {
            const { owner, text } = job.payload;
            await sendDirectMessage(owner, text);
            ReminderDB.delete(job.id);
            break;
          }

          case "post": {
            const event: Event = job.payload;
            console.log(`[Scheduler] Publishing scheduled post for ${JSON.stringify(event)}`)
            pool.publish(CONFIG.relays, event)
            break;
          }

          default: {
            const _exhaustiveCheck: never = job;
            console.warn(`[Scheduler] Unknown job type: ${_exhaustiveCheck}`);
          }
        }
      } catch (err) {
        console.error(`[Scheduler] Failed job ${job.id}:`, err);
      }
    }, delay);
  }

  static restore() {
    // Only reminders are restored for now
    const reminders = ReminderDB.getFutureReminders(Date.now()) as Reminder[];
    reminders.forEach((r) =>
      this.schedule({
        id: r.id,
        type: "reminder",
        scheduled_at: r.scheduled_at,
        payload: r,
      })
    );
    console.log(`[Scheduler] Restored ${reminders.length} reminders`);
  }
}
