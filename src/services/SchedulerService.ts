import { Reminder, ReminderDB } from "../db/reminder.js";
import { sendDirectMessage } from "./sendDM.js";

export class SchedulerService {
  static schedule(reminder: Reminder) {
    const delay = reminder.scheduled_at - Date.now();

    if (delay <= 0) {
      console.warn(`[Scheduler] Skipping past reminder ${reminder.id}`);
      return;
    }

    console.log(`[Scheduler] Scheduling reminder ${reminder.id} in ${delay}ms`);

    setTimeout(async () => {
      try {
        await sendDirectMessage(reminder.owner, reminder.text);
        ReminderDB.delete(reminder.id);
      } catch (err) {
        console.error(
          `[Scheduler] Failed to send reminder ${reminder.id}:`,
          err
        );
      }
    }, delay);
  }

  static restore() {
    const reminders = ReminderDB.getFutureReminders(Date.now());
    reminders.forEach((r) => this.schedule(r as Reminder));
    console.log(`[Scheduler] Restored ${reminders.length} reminders`);
  }
}
