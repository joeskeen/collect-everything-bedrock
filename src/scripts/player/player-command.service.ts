import { Player, System } from "@minecraft/server";
import { DiContainer } from "../shared/di.js";
import { Logger } from "../shared/logging.js";
import { PlayerCollectionService } from "./player-collection.service.js";
import { PlayerNotifierService } from "./player-notifier.service.js";
import { formatCollectedId } from "../shared/format-id.js";
import { CommandPermissionLevel, CustomCommandParamType } from "@minecraft/server";
import { TOTAL_BIOMES, TOTAL_BLOCKS, TOTAL_EFFECTS, TOTAL_ENTITIES, TOTAL_ENCHANTMENTS, TOTAL_ITEMS } from '../dynamic/computed-metrics.js';
import type { PlayerManager } from "../add-on.js";
import type { CustomCommandOrigin } from "@minecraft/server";

export class PlayerCommandService {
  private readonly logger: Logger;
  private readonly system: System;
  private readonly players: Map<string, PlayerManager>;

  constructor(
    private readonly di: DiContainer,
    players: Map<string, PlayerManager>
  ) {
    this.logger = this.di.get(Logger);
    this.system = di.get(System);
    this.players = players;
  }

  registerCommands(init: { customCommandRegistry: any }) {
    const customCommandRegistry = init.customCommandRegistry;

    customCommandRegistry.registerCommand(
      {
        name: "collecteverything:stats",
        description: "Show collection progress",
        permissionLevel: CommandPermissionLevel.Any,
      },
      (origin: CustomCommandOrigin) => this.onStats(origin)
    );

    customCommandRegistry.registerCommand(
      {
        name: "collecteverything:reset",
        description: "Clear all collection progress",
        permissionLevel: CommandPermissionLevel.Admin,
      },
      (origin: CustomCommandOrigin) => this.onReset(origin)
    );

    customCommandRegistry.registerCommand(
      {
        name: "collecteverything:list",
        description: "List collected items by type",
        permissionLevel: CommandPermissionLevel.Any,
        optionalParameters: [{ type: CustomCommandParamType.String, name: "type" }],
      },
      (origin: CustomCommandOrigin, args: any[]) => this.onList(origin, args)
    );

    customCommandRegistry.registerCommand(
      {
        name: "collecteverything:help",
        description: "Show help about collecting",
        permissionLevel: CommandPermissionLevel.Any,
      },
      (origin: CustomCommandOrigin) => this.onHelp(origin)
    );
  }

  private getPlayer(origin: CustomCommandOrigin): Player | undefined {
    const sourceEntity = origin?.sourceEntity;
    if (sourceEntity instanceof Player) {
      return sourceEntity;
    }
    return undefined;
  }

  private getCollectionService(player: Player): PlayerCollectionService | undefined {
    const manager = this.players.get(player.id);
    if (!manager) return undefined;
    return manager.diContainer.get(PlayerCollectionService);
  }

  private onStats(origin: CustomCommandOrigin) {
    const player = this.getPlayer(origin);
    if (!player) {
      this.logger.warn("Stats command: No player found in origin");
      return;
    }

    const collectionService = this.getCollectionService(player);
    if (!collectionService) {
      this.logger.warn(`Stats command: No collection service for player ${player.name}`);
      return;
    }

    const stats = collectionService.getStats();
    const lines = [
      "§6=== Collection Stats ===",
      `§7Items: §f${stats.items}/${TOTAL_BLOCKS + TOTAL_ITEMS}`,
      `§7Entities: §f${stats.entities}/${TOTAL_ENTITIES}`,
      `§7Biomes: §f${stats.biomes}/${TOTAL_BIOMES}`,
      `§7Enchantments: §f${stats.enchantments}/${TOTAL_ENCHANTMENTS}`,
      `§7Effects: §f${stats.effects}/${TOTAL_EFFECTS}`,
      `§6Total: §f${stats.total}/${TOTAL_BLOCKS + TOTAL_ITEMS + TOTAL_ENTITIES + TOTAL_BIOMES + TOTAL_ENCHANTMENTS + TOTAL_EFFECTS}`,
    ];

    const notifier = this.players.get(player.id)?.diContainer.get<PlayerNotifierService>(PlayerNotifierService);
    if (notifier) {
      this.system.run(() => {
        lines.forEach((line) => player.sendMessage(line));
      });
    }
  }

  private onReset(origin: CustomCommandOrigin) {
    const player = this.getPlayer(origin);
    if (!player) {
      this.logger.warn("Reset command: No player found in origin");
      return;
    }

    const collectionService = this.getCollectionService(player);
    if (!collectionService) {
      this.logger.warn(`Reset command: No collection service for player ${player.name}`);
      return;
    }

    collectionService.reset();
    const notifier = this.players.get(player.id)?.diContainer.get<PlayerNotifierService>(PlayerNotifierService);
    if (notifier) {
      this.system.run(() => {
        notifier.toast("Collection reset!");
      });
    }
  }

  private onHelp(origin: CustomCommandOrigin) {
    const player = this.getPlayer(origin);
    if (!player) {
      this.logger.warn("Help command: No player found in origin");
      return;
    }

    const lines = [
      "§6===== Collect Everything Help =====",
      "§e/items §7- Pick up items, mine blocks, or craft items",
      "§e/blocks §7- Mine or break blocks in the world",
      "§e/entities §7- Interact with or kill entities",
      "§e/biomes §7- Visit different biomes",
      "§e/enchantments §7- Apply enchantments to items",
      "§e/effects §7- Gain potion effects",
      "§6-----------------------------------",
      "§7Use §e/collecteverything:stats §7to view progress",
      "§7Use §e/collecteverything:list [type] §7to see collected items",
    ];

    this.system.run(() => {
      lines.forEach((line) => player.sendMessage(line));
    });
  }

  private onList(origin: CustomCommandOrigin, args: any[] | string) {
    const player = this.getPlayer(origin);
    if (!player) {
      this.logger.warn("List command: No player found in origin");
      return;
    }

    const collectionService = this.getCollectionService(player);
    if (!collectionService) {
      this.logger.warn(`List command: No collection service for player ${player.name}`);
      return;
    }

    const type = typeof args === "string" ? args : args?.[0];
    const collection = collectionService.getCollection();

    let filtered: string[];
    if (type) {
      filtered = collection.filter((id) => id.startsWith(`${type}:`));
    } else {
      filtered = collection;
    }

    if (filtered.length === 0) {
      player.sendMessage(`§6No items${type ? ` of type ${type}` : ""} collected yet.`);
      return;
    }

    const formatted = filtered.map((id) => formatCollectedId(id)).sort((a, b) => a.localeCompare(b));

    const byLetter = new Map<string, string[]>();
    for (const name of formatted) {
      const letter = name[0].toUpperCase();
      const list = byLetter.get(letter) ?? [];
      list.push(name);
      byLetter.set(letter, list);
    }

    const typeLabel = type ? `${type}s` : "items";
    const title = `§6=== Collected ${typeLabel} (${formatted.length}) ===`;
    player.sendMessage(title);

    const lines: string[] = [];
    for (const [letter, names] of byLetter) {
      lines.push(`§6${letter}: §f${names.join(", ")}`);
    }

    const pageSize = 15;
    for (let i = 0; i < Math.min(lines.length, 60); i += pageSize) {
      const page = lines.slice(i, i + pageSize);
      this.system.run(() => {
        page.forEach((line) => player.sendMessage(line));
      });
    }

    if (lines.length > 60) {
      player.sendMessage(`§7... and ${lines.length - 60} more letter groups`);
    }
  }
}