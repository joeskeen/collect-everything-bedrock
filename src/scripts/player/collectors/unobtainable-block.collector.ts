import { Player, PlayerBreakBlockAfterEvent, World } from "@minecraft/server";
import { DiContainer } from "../../shared/di.js";
import { Logger } from "../../shared/logging.js";
import { CollectFn } from "./collect.js";
import { UNOBTAINABLE_BLOCKS } from "../../generated/unobtainable_blocks.js";

const unobtainableBlockSet = new Set(UNOBTAINABLE_BLOCKS.map((e: { name: string }) => e.name));

export class UnobtainableBlockCollector {
  private readonly logger: Logger;
  private readonly world: World;
  private readonly player: Player;
  private readonly breakCallback: (event: PlayerBreakBlockAfterEvent) => void;
  private readonly unsubscribe: () => void;

  constructor(di: DiContainer, private readonly collect: CollectFn) {
    this.logger = di.get(Logger);
    this.world = di.get<World>(World);
    this.player = di.get(Player);

    this.breakCallback = this.onBlockBroken.bind(this);
    this.world.afterEvents.playerBreakBlock.subscribe(this.breakCallback);
    this.unsubscribe = () => this.world.afterEvents.playerBreakBlock.unsubscribe(this.breakCallback);
  }

  private onBlockBroken(event: PlayerBreakBlockAfterEvent) {
    if (event.player.id !== this.player.id) return;

    const block = event.brokenBlockPermutation;
    const blockId = block.type.id;
    if (!unobtainableBlockSet.has(blockId)) return;

    this.logger.debug(`Collected block: ${blockId}`);
    this.collect(`block:${blockId}`);
  }

  dispose() {
    this.unsubscribe();
  }
}