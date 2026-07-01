export interface StringField {
  maxLength: number;
}
export interface NumberField {
  digits: number;
  default: number;
}
export interface DataSchema {
  _prefix?: string;
  [key: string]: StringField | NumberField | string | undefined;
}

function isNumberField(config: StringField | NumberField | string | undefined): config is NumberField {
  return config !== undefined && typeof config !== 'string' && 'digits' in config;
}

function isStringField(config: StringField | NumberField | string | undefined): config is StringField {
  return config !== undefined && typeof config !== 'string' && 'maxLength' in config;
}

/**
 * Encodes data into a JSON UI-compatible string for Minecraft Bedrock
 * @param data - Field values to encode
 * @param schema - Schema object with fields at root level (includes optional _prefix for title_text)
 * @param displayText - The text to display on the button (after the encoded data)
 * @returns Encoded string
 */
export function encodeItemData(data: Record<string, number | string>, schema: DataSchema, displayText = "") {
  const separator = "§~§r";
  const globalPrefix = schema._prefix || "";
  let header = globalPrefix;

  const sortedEntries = Object.entries(schema)
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([name]) => name !== "_prefix");

  for (const [name, config] of sortedEntries) {
    if (isNumberField(config)) {
      const value = (data[name] ?? config.default ?? 0) as number;
      if (typeof value !== "number" || Number.isNaN(value)) {
        throw new Error("Field " + name + " must be a valid number, got: " + String(value));
      }
      if (value < 0) {
        throw new Error("Field " + name + " cannot be negative, got: " + value);
      }
      if (!Number.isInteger(value)) {
        throw new Error("Field " + name + " must be an integer, got: " + value);
      }
      if (value >= Math.pow(10, config.digits)) {
        throw new Error("Field " + name + " value " + value + " exceeds " + config.digits + " digits");
      }
      const padded = String(value).padStart(config.digits, "0");
      const prefix = "|" + name + "|:";
      header += prefix + padded;
    } else if (isStringField(config)) {
      const value = (data[name] ?? "") as string;
      const encoder = new TextEncoder();
      const bytes = encoder.encode(value).length;
      if (bytes > config.maxLength) {
        throw new Error("Field " + name + " exceeds maxLength: " + bytes + " > " + config.maxLength + " bytes");
      }
      const prefix = "|" + name + "|:";
      header += prefix + value.padEnd(config.maxLength);
    }
  }

  return header + separator + displayText;
}
