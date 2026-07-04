Happy 250th Birthday to the United States of America! This release is dedicated to the land of the free and the home of the brave. May you enjoy the freedom this country has spread throughout the world; may your holiday festivities be merry, and your collection quest bring new adventures to your Minecraft worlds!

## Version 1.1.1 Changes

### FEATURES

**The Collection Browser** - Starting in this version, the main way of interacting with the add-on is through the graphical collection browser. No more squinting at chat scrollback - everything is laid out in a tabbed UI with per-category progress bars, toolbar buttons, scrollable grids, and category tabs that actually stay lit when you click them (it only took me like 5 commits to get that working). Categories: Items, Entities, Biomes, Enchantments, Effects, Unobtainables, and a Session view. There are buttons to open search, settings, and more. The commands are still there and always will be, but for most users the browser is now the way to go.

Open it with `/collecteverything:browse`, by holding your checklist item in hand, or by placing and interacting with the checklist block.

**Checklist Item & Block** - A new craftable and placable checklist item (planks + paper + any metal nugget) gives you easy access to the collection browser, especially on touch devices and consoles, where typing commands is more painful than falling in the middle of a lava pool with all your stuff and no way of saving it. You will be provided one the first time you spawn into the world! Keep one in your inventory for quick access, or hang it on the wall of your base so you can check it when you get home from an adventure! It's stackable so you can put it in a bundle as well.

**Difficulty Levels** - You can now choose how granular your variant tracking is via the settings modal or `/collecteverything:settings`:

- **Basic** - one entry per entity/item type. Easy mode.
- **Committed** - each variant field tracked independently (e.g., `horse+color:brown` and `horse+markVariant:spot` as separate entries).
- **Insane** - every valid combination. That means 35 horse combos. That means 2000+ tropical fish. You have been warned.

Existing collections adapt when you switch levels (you won't lose progress), so don't be afraid to change your mind.

**Search** - The collection browser has a built-in search button for filtering the list, and the `/collecteverything:all [keyword]` command lets you search across everything in the game with color-coded highlights showing what you've collected versus what you still need.

**Session Tracking** - The clock icon on the collection browser or issuing the `/collecteverything:session` command shows you everything you've collected since you logged into the world last. Great for speedrunning challenges or just seeing what you picked up on today's adventure.

**Entity Variant Tracking** - Entities now properly identify and track their variants. Horses track both color and markings (35 combos). Tropical fish track all 4 variant dimensions (color, color2, markVariant, variant). Villager professions, axolotl colors, llama colors, cat variants, and more are all now distinguished. Go catch 'em all. For real this time.

**Enchantment Variants** - Enchantments now track each level separately (only in Insane difficulty). Names are properly displayed , such as "Protection IV".

**Effect Levels** - Status effects now report the correct amplifier levels, and impossible to obtain effect levels are excluded from the goal.

**60+ Biome Textures** - Every biome in the game now has its own custom texture in the collection browser. Yes, even the obscure ones. Yes, even Pale Garden. Yes, I spent way too long on this (several hours of exploring my test world to find each biome and take a representative screenshot if it...).

**Ender Dragon Collector** - As the Ender Dragon is usually only defeated once per world, I thought it would be fair for all those who helped defeat it to get credit. When the Ender Dragon is killed, all players within a 100-block radius of the death event will get credit for collecting it. This makes it so you don't have to re-spawn the dragon several times just to allow everyone the final blow.

**Settings & Admin Panels** - A proper settings modal for each player (difficulty, active category). An admin settings panel for world difficulty override, broadcast toggles, and scoreboard settings. A debug settings panel for log level and log destination configuration. Yes, I did actually hook them up this time.

**Scoreboard** - The scoreboard sidebar now works properly, showing each player's total collected count. Admins can toggle it on or off. Race your friends.

**Performance & Caching** - Registries were refactored with caching mechanisms so browsing your collection doesn't melt your phone. Player initialization uses Fibonacci backoff, so slow world loads won't crash your game. Unified registry interface across all collection types means everything talks to each other consistently and cleanly now.

### BREAKING CHANGES

I know I promised last time would be the last time your progress would get wiped. I am genuinely sorry. But once you understand _why_ this change had to happen, I think you'll agree it was inevitable.

Let me walk you through the storage format evolution:

**v0.1.x - World-level storage.** Your collection data was stored at the world level, keyed by your player unique ID. This worked, but was fragile - your data was associated with an ID lookup, not actually tied to your player.

**v0.2.x - Single dynamic property.** We moved your collection into Bedrock's dynamic properties system, which stores data per-player. Much better - your progress was actually _yours_ now. But there was a massive flaw I didn't catch until it was too late: Bedrock's Script API only allows **32 kilobytes** of data in a single dynamic property string value. You could get pretty far into your collection before hitting that limit, but sooner or later - after collecting enough entities, items, biomes, enchantments, effects, and unobtainables - the JSON-serialized blob of your entire collection would exceed 32kB and fail silently. At that point, your hard work would be gone.

**v1.1.x - Per-item dynamic properties.** So we pivoted. Each thing you collect is now stored in its own dynamic property. This has several benefits:

- We will **never** hit that 32kB hard limit - not now, not ever.
- We can store more metadata about each collected thing, like how many times you've collected it and when you most recently collected it.
- It makes for a much more predictable and stable future as Minecraft continues to evolve.

I promised the 0.2.x format would be the last change, and I was wrong. So I won't just promise this time - I'll put it in writing: **if for any reason we ever change the storage format again, we will provide an automatic data migration so you won't even notice anything is different.** That's a hard guarantee.

To re-collect items already in your inventory, move them around and the item collector will pick them up. Entities will need to be re-killed, re-tamed, or re-named. Biomes, effects, and enchantments should re-collect as you interact with them naturally.

The current command set (namespace `collecteverything:`) is:

| Command         | What it does                                   |
| --------------- | ---------------------------------------------- |
| `browse`        | Open the collection browser UI                 |
| `stats`         | Per-category progress                          |
| `all [keyword]` | Search the full game catalog                   |
| `collected`     | What you've found                              |
| `uncollected`   | What you haven't                               |
| `session`       | This session's haul                            |
| `settings`      | Change difficulty                              |
| `extra`         | Unrecognized tracked items (for other add-ons) |

Admin-only (require game director or higher permissions):

| Command            | What it does                             |
| ------------------ | ---------------------------------------- |
| `_admin_settings`  | World difficulty, scoreboard, broadcasts |
| `_reset_all`       | Nuke everyone's progress                 |
| `__debug_settings` | Logging configuration                    |

---

We did it. We finally made it to version 1.0+. This is considered a stable release. Go ahead and install it anywhere Minecraft Bedrock is played. Enjoy it. If you have any problems with it, please comment on CurseForge or open an issue on GitHub. There's still way more features we want to bring to this add-on, and we'd love to get it published on the official Marketplace some day. Your engagement, sponsorship, and contributions can make that happen!

Happy collecting!
-Joe
