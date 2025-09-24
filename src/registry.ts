import { Event } from "nostr-tools";

export type NRPCParams = Record<string, string>;
export type ControllerHandler = (
  params: NRPCParams,
  requestEvent: Event,
  ctx: { sendPartial?: (tags: string[][], content?: string) => Promise<void> }
) => Promise<any> | any;

export type MethodSpecParam = {
  name: string;
  type: string;
  required?: boolean;
};

export type MethodSpecError = { code: number; message: string };
export type MethodSpecReturn = { name: string; type: string };

export type MethodSpec = {
  name: string;
  params?: MethodSpecParam[];
  returns?: MethodSpecReturn[];
  errors?: MethodSpecError[];
  handler: ControllerHandler;
};

export class MethodRegistry {
  private methods = new Map<string, MethodSpec>();

  register(
    name: string,
    handler: MethodSpec["handler"],
    spec?: Omit<MethodSpec, "name" | "handler">
  ) {
    this.methods.set(name, { name, handler, ...spec });
  }

  has(name: string): boolean {
    return this.methods.has(name);
  }
  get(name: string): MethodSpec["handler"] | undefined {
    return this.methods.get(name)?.handler;
  }
  list(): MethodSpec[] {
    return [...this.methods.values()];
  }
}

export const Methods = new MethodRegistry();
