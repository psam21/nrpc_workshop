import { Event } from "nostr-tools";

export type NRPCParams = Record<string, string>;
export type ControllerHandler = (
  params: NRPCParams,
  requestEvent: Event,
  ctx: { sendPartial?: (tags: string[][], content?: string) => Promise<void> }
) => Promise<any> | any;

export class MethodRegistry {
  private methods = new Map<string, ControllerHandler>();

  register(name: string, handler: ControllerHandler) {
    if (this.methods.has(name))
      throw new Error(`Method ${name} already registered`);
    this.methods.set(name, handler);
  }
  has(name: string) {
    return this.methods.has(name);
  }
  get(name: string) {
    return this.methods.get(name);
  }
  list() {
    return Array.from(this.methods.keys());
  }
}

export const Methods = new MethodRegistry();
