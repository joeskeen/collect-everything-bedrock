import { fromEventPattern, Observable } from "rxjs";

interface BedrockEventSignal<TEvent, TOptions> {
  subscribe(callback: (arg0: TEvent) => void, options?: TOptions): (arg0: TEvent) => void;
  unsubscribe(callback: (arg0: TEvent) => void): void;
}

export function fromBedrockEvent<TEvent, TOptions>(
  eventSource: BedrockEventSignal<TEvent, TOptions>,
  options?: TOptions
): Observable<TEvent> {
  return fromEventPattern(
    (handler) => {
      // Safely check if options were actually provided by your code
      if (options !== undefined) {
        return eventSource.subscribe(handler, options);
      }
      // If no options, strictly pass ONLY 1 argument to Minecraft's native C++ runtime
      return eventSource.subscribe(handler);
    },
    (handler) => eventSource.unsubscribe(handler)
  );
}
