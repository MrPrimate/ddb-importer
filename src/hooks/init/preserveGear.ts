/** Item creation option that keeps the `gear` property exactly as the parser set it. */
export const PRESERVE_GEAR_OPTION = "ddbimporterPreserveGear";

/**
 * Adds the preserve-gear flag to embedded Item creation options. The flag is not a
 * Foundry option, so it is added here rather than in each options literal.
 */
export function preserveGearOptions<T extends object>(options: T): T {
  return { ...options, [PRESERVE_GEAR_OPTION]: true };
}

/**
 * dnd5e's physical item `_preCreate` (preCreateGear) adds the `gear` property to
 * every non-natural item created on an NPC. Items embedded in `Actor.create` never
 * run it, but our re-munch and world update paths recreate items with
 * createEmbeddedDocuments, which would put every monster attack on the Gear line.
 * The preCreateItem hook runs after `_preCreate`, so it restores the parsed state.
 */
export function preserveImportedGear() {
  Hooks.on<"preCreateItem">("preCreateItem", restoreParsedGear);
}

/** The slice of an Item the hook touches; the full Item type is too large a union to infer here. */
interface IGearHookItem {
  system: { properties?: Set<string> };
  updateSource(changes: Record<string, unknown>): unknown;
}

function restoreParsedGear(document: unknown, data: unknown, options: unknown) {
  if (!(options as Record<string, unknown> | undefined)?.[PRESERVE_GEAR_OPTION]) return;
  const item = document as IGearHookItem;
  const current = item.system.properties;
  if (!current) return;
  const wanted = new Set((foundry.utils.getProperty(data as object, "system.properties") as string[] | undefined) ?? []);
  if (current.has("gear") === wanted.has("gear")) return;
  const properties = Array.from(current).filter((p) => p !== "gear");
  if (wanted.has("gear")) properties.push("gear");
  item.updateSource({ "system.properties": properties });
}
