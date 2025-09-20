import { MethodRegistry } from "../registry.js";
export class BaseController {
  protected registry: MethodRegistry;
  constructor(registry: MethodRegistry) {
    this.registry = registry;
  }
}
