/**
 * Registry for the class/subclass SPECIAL_ADVANCEMENTS tables.
 *
 * This is split out for tests
 */

type TSpecialAdvancementSource = "class" | "subclass";

const registry = new Map<TSpecialAdvancementSource, TDDBClassSpecialAdvancements>();

export function registerSpecialAdvancements(source: TSpecialAdvancementSource, table: TDDBClassSpecialAdvancements): void {
  registry.set(source, table);
}

export function findSpecialAdvancement(featureName: string): TDDBClassSpecialAdvancements[string] | undefined {
  return registry.get("class")?.[featureName] ?? registry.get("subclass")?.[featureName];
}
