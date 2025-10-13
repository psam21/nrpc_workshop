import { SchedulerService } from "./SchedulerService.js";
import { generateId } from "../utils.js";
import { ReminderDB } from "../db/reminder.js";

export class ReminderService {
  static create(time: string, text: string, date: string, owner: string) {
    if (!time || !text || !date) {
      const err: any = new Error("time, text, and date are required");
      err.status = 400;
      throw err;
    }

    const reminderId = generateId(6);
    const scheduledAt = new Date(`${date} ${time}`).getTime();

    if (isNaN(scheduledAt)) {
      const err: any = new Error("invalid date or time format");
      err.status = 400;
      throw err;
    }

    const reminder = {
      id: reminderId,
      time,
      date,
      text,
      owner,
      scheduled_at: scheduledAt,
    };
    ReminderDB.insert(reminder);
    SchedulerService.schedule({ id: reminderId, type: "reminder", payload: reminder, scheduled_at: scheduledAt });

    return {
      reminder_id: reminderId,
      scheduled_at: new Date(scheduledAt).toISOString(),
      text,
      owner,
    };
  }
}
