/**
 * The paragraphs of the Illusory Dragon spell text the dragon's features are built
 * from, found by the save each one names rather than by position so the XGtE and
 * Arcana Unleashed printings (different paragraph counts, [lore] tags) both resolve.
 * Kept import-free so tests can load it without the companion mixin graph.
 */
export function illusoryDragonFeatureText(raw: string): { fear: string; breath: string; illusion: string } {
  const paragraphs = Array.from(raw.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g))
    .map((match) => match[1].replace(/\[\/?lore\]/g, "").trim())
    .filter((paragraph) => paragraph !== "");
  const find = (pattern: RegExp): string => paragraphs.find((paragraph) => pattern.test(paragraph)) ?? "";
  return {
    fear: find(/Wisdom saving throw/i),
    breath: find(/Intelligence saving throw/i),
    illusion: find(/Investigation/i),
  };
}
