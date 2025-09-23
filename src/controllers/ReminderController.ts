// ---------------------------
import { NRPCParams, MethodRegistry } from "../registry.js";
import { BaseController } from "./BaseController.js";
import { Event } from "nostr-tools";
import { generateId } from "../utils.js";

export class ReminderController extends BaseController {
  constructor(registry: MethodRegistry) {
    super(registry);
    registry.register("createReminder", this.createReminder.bind(this));
    registry.register("getMethods", this.getMethods.bind(this));
  }

  async createReminder(params: NRPCParams, event: Event) {
    console.log("I GOT CALLED", params, params.Time, params.Text);
    if (!params.Time || !params.Text || !params.Date) {
      const err: any = new Error("time and text required");
      err.status = 400;
      throw err;
    }
    const reminderId = generateId(6);
    return {
      reminder_id: reminderId,
      scheduled_at: params.time,
      text: params.text,
      owner: event.pubkey,
    };
  }

  async getMethods() {
    return { methods: this.registry.list() };
  }
}
