# JSON UI Reference

## Useful Resources

- [Bedrock Wiki - JSON UI Documentation](https://wiki.bedrock.dev/json-ui/json-ui-documentation)
- [Minecraft Creator Documentation - JSON UI Reference](https://learn.microsoft.com/minecraft/creator/reference/content/jsonuireference)

## Key Concepts Learned

### Grid Layouts

- The `grid` component uses `grid_dimensions` to define columns and rows (e.g., `[17, 8]`)
- Grid cells are rendered within their parent container's size constraints
- The `stack_panel` containing a grid must be wide enough to fit all columns (cell_size \* num_columns)

### Variable Binding

- Variables are referenced with `$variable_name` in JSON UI
- Variables can be defined in `_global_variables.json` or passed via form bindings
- Variable overrides in child controls use the `$variable_name` format

### Form Visibility

- Forms use a `condition` binding to determine which layout variant to show
- The binding expression `(not ((#title_text - $condition) = #title_text))` checks if the title contains the condition string
- Use unique prefixes (like `§c§o§l§l§e§c§t§i§o§n`) to ensure only one layout matches

### Title Encoding

- Minecraft uses special color codes in titles to identify form types
- Format: `§[letter]` sequences act as identifiers, not actual colors
- Example: `§c§o§l§l§e§c§t§i§o§n§1§3§6` identifies a 17x8 collection browser

### Background Textures

- `textures/ui/dialog_background_opaque` - stretches to fill any size
- `textures/ui/cartography_table_empty` - does NOT stretch well, use for fixed sizes

## File Organization

### UI Files

- `_ui_defs.json` - lists all UI definition files to load
- `_global_variables.json` - global variables used across UI definitions
- `server_form.json` - the main form container that selects which panel to display
- `*_server_form.json` - custom UI definitions for specific form types

### Form Data Classes

- `CollectionFormData` in `scripts/shared/forms.ts` - creates the custom grid forms
- Uses `ActionFormData` internally but with custom UI bindings

## Debugging Tips

1. **Blank screen**: Check if the panel visibility binding is correct (title must match condition)
2. **Wrong layout**: Verify the condition string in both the template and the form data
3. **Squished grid**: Ensure the parent stack_panel is wide enough for all columns
4. **JSON errors**: Check for missing/extra commas, and remember JSON UI allows comments (JSONC format)
