export class DiContainer {
    parent;
    services = new Map();
    constructor(parent) {
        this.parent = parent;
    }
    register(token, instance) {
        this.services.set(token, instance);
    }
    get(token, defaultValue) {
        const service = this.services.get(token) ?? this.parent?.get(token) ?? defaultValue;
        if (service === undefined) {
            throw new Error(`Service not found for token: ${token}`);
        }
        return service;
    }
    dispose() {
        [...this.services.values()].forEach((service) => service.dispose?.());
        this.services.clear();
    }
}
