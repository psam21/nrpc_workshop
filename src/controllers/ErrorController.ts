import { MethodRegistry } from "../registry.js";
import { BaseController } from "./BaseController.js";
import { Event } from "nostr-tools";

export class ErrorController extends BaseController {
  constructor(registry: MethodRegistry) {
    super(registry);

    registry.register("alwaysError", this.alwaysError.bind(this), {
      params: [{ name: "message", type: "string", required: false }],
      returns: [],
      errors: [
        { code: 400, message: "Always fails" },
        { code: 500, message: "Internal server error" },
      ],
    });
  }

  async alwaysError(params: Record<string, any>, event: Event) {
    const err: any = new Error(params.message || "Always fails");
    err.status = 400;
    throw err;
  }
}
