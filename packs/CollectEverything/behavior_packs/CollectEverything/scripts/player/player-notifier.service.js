import { Player, System } from "@minecraft/server";
import { Logger } from "../shared/logging.js";
/**
 * calculate a good amount of time to show a message based on its length, with a minimum of 2 seconds and a maximum of 10 seconds
 * @param text
 * @returns
 */
export function messageDurationTicks(text) {
    // formula (ms): Duration = min(max(message length * 50, 2000), 10000)
    const length = text.length;
    const ms = Math.min(Math.max(length * 50, 2000), 10000);
    const ticks = Math.ceil(ms / 50);
    return ticks;
}
export class PlayerNotifierService {
    di;
    static loopInterval = 10; // Check every 10 ticks
    static playerLoadingDelay = 120; // Delay before starting to send messages to ensure player is fully loaded
    logger;
    player;
    system;
    messageQueue = [];
    disposed = false;
    constructor(di) {
        this.di = di;
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
    toast(message) {
        this.addMessage({ type: "actionbar", content: message });
    }
    title(title, subtitle) {
        this.addMessage({ type: "title", content: title });
        if (subtitle) {
            this.addMessage({ type: "subtitle", content: subtitle });
        }
    }
    addMessage(message) {
        this.messageQueue.push({
            ...message,
            duration: messageDurationTicks(message.content),
        });
    }
    run(message) {
        if (this.disposed)
            return;
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
