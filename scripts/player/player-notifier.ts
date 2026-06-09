import type { Player, RawMessage, System, TitleDisplayOptions } from "@minecraft/server";
import { Disposable } from "../shared/disposable";
import { Logger } from "../shared/logging/logger";
import { PLAYER_INITIALIZATION_DELAY_TICKS, QUEUE_PROCESSING_INTERVAL_TICKS } from "../shared/ticks";
import { inject, Lifecycle, scoped } from "tsyringe";
import { PLAYER_TOKEN, SYSTEM_TOKEN } from "../shared/global-tokens";

/**
 * calculate a good amount of time to show a message based on its length, with a minimum of 2 seconds and a maximum of 10 seconds
 * @param text
 * @returns
 */
export function messageDurationTicks(message: RawMessage) {
  const text = JSON.stringify(message);
  // formula (ms): Duration = min(max(message length * 50, 2000), 10000)
  const length = text.length;
  const ms = Math.min(Math.max(length * 50, 2000), 10000);
  const ticks = Math.ceil(ms / 50);
  return ticks;
}

export interface Message {
  type: "actionbar" | "title" | "subtitle";
  content: RawMessage;
  duration?: number;
}

@scoped(Lifecycle.ContainerScoped)
export class PlayerNotifier implements Disposable {
  private readonly messageQueue: Message[] = [];
  private disposed = false;

  constructor(
    @inject(Logger) private readonly logger: Logger,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(SYSTEM_TOKEN) private readonly system: System
  ) {}

  toast(message: RawMessage) {
    this.addMessage({ type: "actionbar", content: message });
  }

  title(title: RawMessage, subtitle?: RawMessage) {
    this.addMessage({ type: "title", content: title });
    if (subtitle) {
      this.addMessage({ type: "subtitle", content: subtitle });
    }
  }

  private addMessage(message: Message) {
    this.messageQueue.push({
      ...message,
      duration: messageDurationTicks(message.content),
    });
  }

  run() {
    this.tick();
  }

  tick(message?: Message) {
    if (this.disposed) return;

    const duration = message?.duration ?? QUEUE_PROCESSING_INTERVAL_TICKS;
    if (message) {
      switch (message.type) {
        case "actionbar":
          this.player.onScreenDisplay.setActionBar(message.content);
          break;
        case "subtitle":
          this.player.onScreenDisplay.updateSubtitle(message.content);
          break;
        case "title":
          this.player.onScreenDisplay.setTitle(message.content, { stayDuration: duration } as TitleDisplayOptions);
      }
      if (message.content) {
        this.player.runCommand(`playsound random.toast @p`);
      }
    }
    this.system.runTimeout(() => {
      const nextMessage = this.messageQueue.shift();
      this.tick(nextMessage);
    }, duration);
  }

  dispose() {
    this.disposed = true;
  }
}
