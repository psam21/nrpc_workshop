import { MethodRegistry } from "../registry.js";
import { SchedulePostService } from "../services/SchedulePostService.js";

export class SchedulePostController {
  constructor(registry: MethodRegistry) {
    registry.register(
      "schedulePost",
      async (params, event) => {
        console.log("[SchedulePostController] Incoming NRPC call:", event.id);
        console.log("Raw params:", JSON.stringify(params, null, 2));

        try {
          // Extract and normalize inputs
          const timestampStr = params["When do you want it posed?"];
          const nostrEventStr = params["Say something!"];

          if (!timestampStr || !nostrEventStr) {
            throw new Error("Missing required parameters from form");
          }

          const scheduledAt = Number(timestampStr) * 1000;
          const nostrEvent = JSON.parse(nostrEventStr);

          console.log("[SchedulePostController] Parsed Nostr event:", nostrEvent);
          console.log("[SchedulePostController] Scheduled for:", new Date(scheduledAt).toISOString());

          // 🧩 Call the stub service
          const result = SchedulePostService.createFromEvent(scheduledAt, nostrEvent);

          console.log("[SchedulePostController] SchedulePostService result:", result);
          return result;
        } catch (err: any) {
          console.error("[SchedulePostController] Error:", err);
          throw err;
        }
      },
      {
        params: [
          { name: "When do you want it posed?", type: "string", required: true },
          { name: "Say something!", type: "string", required: true },
        ],
        returns: [
          { name: "post_id", type: "string" },
          { name: "scheduled_at", type: "string" },
        ],
      }
    );
  }
}
