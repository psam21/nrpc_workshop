import { Event } from "nostr-tools";
import { generateId } from "../utils.js";
import { SchedulerService } from "./SchedulerService.js";

export class SchedulePostService {
  static createFromEvent(scheduledAt: number, event: any) {
    const jobId = generateId(6);

    const job = {
      id: jobId,
      type: "post" as const,
      scheduled_at: scheduledAt,
      payload: event,
    };

    console.log("[SchedulePostService] Scheduling post job:", JSON.stringify(job, null, 2));
    SchedulerService.schedule(job);

    return {
      post_id: jobId,
      scheduled_at: new Date(scheduledAt).toISOString(),
      event_kind: event.kind,
      event_id: event.id,
    };
  }
}
