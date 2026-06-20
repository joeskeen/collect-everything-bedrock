/**
 * Turns the logic for inventory slots on/off. Only set this to false if you have disabled inventory in RP/ui/_global_variables.json side!
 * Disabling this may also reduce form opening lag a bit.
 */
export const inventory_enabled = false;
export type CustomContent = {
  texture: string;
  type: "block" | "item";
};
/**
 * Defines the custom block & item IDs for the form.
 * You can reference either a vanilla texture icon, which functions identically to other items...
 * ...or reference a texture path, which removes enchant glint and 3d block render capability.
 */
export const custom_content: Record<string, CustomContent> = {
  /*
	'custom:block': {
		 texture: 'minecraft:gold_block',
		 type: 'block'
	},
	'custom:item': {
		 texture: 'textures/items/paper',
		 type: 'item'
	},
	*/
};
//Blocks are excluded from the count, as they do not shift vanilla IDs.
export const number_of_custom_items = Object.values(custom_content).filter((v) => v.type === "item").length;
export const custom_content_keys = new Set(Object.keys(custom_content));
