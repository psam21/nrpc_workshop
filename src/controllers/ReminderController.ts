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
    if (!params.time || !params.text) {
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
