`inventory_item_renderer` requires numeric `item_id_aux` values to render item icons, but there's no way to get these values at runtime. The engine has all the info needed to do this automatically; it just doesn't expose it.
Even though the JSON UI Documentation at Bedrock.dev states that the aux value is easily derived using `Aux = ID * 65536` (see https://wiki.bedrock.dev/json-ui/json-ui-documentation#item-id-aux-item-id-aux), in practice it seems that item IDs over 255 require some adjustment to render properly, and if there are custom add-ons installed it makes it even less predictable.

## Request

Add a renderer (or extend `inventory_item_renderer`) that accepts an item identifier string and automatically resolves it to the correct texture.
The renderer would:

1. Accept `"minecraft:diamond_sword"` as input
2. Resolve the texture for that item internally (as we have no way of knowing how that works under the hood)

## Why This Matters

- `ItemStack.typeId` returns string identifiers—no way to get numeric runtime ID
- Numeric IDs shift when custom items load
- Entity render controllers already solve this: they accept string shortnames and resolve to textures automatically
- Add-ons that need information about both vanilla and other add-on items (like one for keeping track of collecting every possible item) currently has no way of rendering arbitrary item icons.

https://feedback.minecraft.net/hc/en-us/community/posts/46847925874957/comments/46848086834573
I realize that JSON UI is the old technology and it may be not a priority to add functionality to it; however, as its successor DDUI does not have any way of rendering images at all, much less text colors or styles I thought it would be most fitting to put this request under JSON UI.
