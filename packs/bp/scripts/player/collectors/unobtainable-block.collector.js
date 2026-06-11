import { Player, World } from "@minecraft/server";
import { Logger } from "../../shared/logging.js";
import { UNOBTAINABLE_BLOCKS } from "../../generated/unobtainable_blocks.js";
const unobtainableBlockSet = new Set(UNOBTAINABLE_BLOCKS.map((e) => e.name));
export class UnobtainableBlockCollector {
    collect;
    logger;
    world;
    player;
    breakCallback;
    unsubscribe;
    constructor(di, collect) {
        this.collect = collect;
        this.logger = di.get(Logger);
        this.world = di.get(World);
        this.player = di.get(Player);
        this.breakCallback = this.onBlockBroken.bind(this);
        this.world.afterEvents.playerBreakBlock.subscribe(this.breakCallback);
        this.unsubscribe = () => this.world.afterEvents.playerBreakBlock.unsubscribe(this.breakCallback);
    }
    onBlockBroken(event) {
        if (event.player.id !== this.player.id)
            return;
        const block = event.brokenBlockPermutation;
        const blockId = block.type.id;
        if (!unobtainableBlockSet.has(blockId))
            return;
        this.logger.debug(`Collected block: ${blockId}`);
        this.collect(`block:${blockId}`);
    }
    dispose() {
        this.unsubscribe();
    }
}
