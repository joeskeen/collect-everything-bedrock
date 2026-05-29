import { Player, System } from "@minecraft/server";
import { Disposable } from "../shared/disposable.js";
import { DiContainer } from "../shared/di.js";
import { Logger } from "../shared/logging.js";

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

export class PlayerNotifierService implements Disposable {
  private static readonly loopInterval = 10; // Check every 10 ticks
  private static readonly playerLoadingDelay = 120; // Delay before starting to send messages to ensure player is fully loaded

  private readonly logger: Logger;
  private readonly player: Player;
  private readonly system: System;

  private readonly messageQueue: Message[] = [];
  private disposed = false;

  constructor(private readonly di: DiContainer) {
    this.logger = di.get(Logger);
    this.player = di.get(Player);
    this.system = di.get(System);

    // force a short delay before starting to send messages to ensure the player is fully loaded
    this.messageQueue.push({
      type: "actionbar",
      content: "",
      duration: PlayerNotifierService.playerLoadingDelay,
    });
    this.run();
  }

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

  private run(message?: Message) {
    if (this.disposed) return;

    const duration = message?.duration ?? PlayerNotifierService.loopInterval;
    if (message?.content) {
      this.logger.debug(`Showing message: ${message ? `${message.type} - ${message.content}` : "none"}, next in ${duration} ticks`);
    }
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
