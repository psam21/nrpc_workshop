// ---------------------------
import { NRPCParams, MethodRegistry } from "../registry.js";
import { BaseController } from "./BaseController.js";
import { Event } from "nostr-tools";
import { ReminderService } from "../services/ReminderService.js";
import { SchedulerService } from "../services/SchedulerService.js";

export class ReminderController extends BaseController {
  constructor(registry: MethodRegistry) {
    super(registry);

    registry.register("createReminder", this.createReminder.bind(this), {
      params: [
        { name: "Time", type: "string", required: true },
        { name: "Text", type: "string", required: true },
        { name: "Date", type: "string", required: true },
      ],
      returns: [
        { name: "reminder_id", type: "string" },
        { name: "scheduled_at", type: "string" },
        { name: "text", type: "string" },
        { name: "owner", type: "string" },
      ],
      errors: [{ code: 400, message: "time and text required" }],
    });

    registry.register("getMethods", this.getMethods.bind(this));
    SchedulerService.restore();
  }

  async createReminder(params: NRPCParams, event: Event) {
    console.log(
      "Time",
      "Text",
      "Date",
      params.Time,
      params.Text,
      params.Date,
      JSON.stringify(params)
    );
    if (!params.Time || !params.Text || !params.Date) {
      const err: any = new Error("time and text required");
      err.status = 400;
      throw err;
    }
    const result: any = ReminderService.create(
      params.Time,
      params.Text,
      params.Date,
      event.pubkey
    );
    result.message = "Message is now scheduled";
  }

  async getMethods() {
    return this.registry.list();
  }
}
