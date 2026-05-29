export type Class = Function;

export class DiContainer {
  private readonly services = new Map<any, any>();

  constructor(private readonly parent?: DiContainer) {}

  register<T>(token: any, instance: T) {
    this.services.set(token, instance);
  }

  get<T>(token: any, defaultValue?: T): T {
    const service = this.services.get(token) ?? this.parent?.get(token) ?? defaultValue;
    if (service === undefined) {
      throw new Error(`Service not found for token: ${token}`);
    }
    return service as T;
  }
  
  dispose() {
    [...this.services.values()].forEach((service) => service.dispose?.());
    this.services.clear();
  }
}
