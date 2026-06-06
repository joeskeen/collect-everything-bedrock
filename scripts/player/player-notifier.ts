import type { Player, System } from "@minecraft/server";
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
export function messageDurationTicks(text: string) {
  // formula (ms): Duration = min(max(message length * 50, 2000), 10000)
  const length = text.length;
  const ms = Math.min(Math.max(length * 50, 2000), 10000);
  const ticks = Math.ceil(ms / 50);
  return ticks;
}

export interface Message {
  type: "actionbar" | "title" | "subtitle";
  content: string;
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

  toast(message: string) {
    this.addMessage({ type: "actionbar", content: message });
  }

  title(title: string, subtitle?: string) {
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

  run(message?: Message) {
    if (this.disposed) return;

    // force a short delay before starting to send messages to ensure the player is fully loaded
    this.messageQueue.push({
      type: "actionbar",
      content: "",
      duration: PLAYER_INITIALIZATION_DELAY_TICKS,
    });

    const duration = message?.duration ?? QUEUE_PROCESSING_INTERVAL_TICKS;
    if (message) {
      this.player.runCommand(`title @s ${message.type} ${message.content}`);
      if (message.content) {
        this.player.runCommand(`playsound random.toast @p`);
      }
    }
    this.system.runTimeout(() => {
      const nextMessage = this.messageQueue.shift();
      this.run(nextMessage);
    }, duration);
  }

  dispose() {
    this.disposed = true;
  }
}
