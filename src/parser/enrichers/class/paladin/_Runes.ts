/**
 * Oath of the Ebon Blade and the World of Warcraft Death Knight share Runeforging, Runic Power and
 * Runic Mastery. The Ebon Blade text lists all three runes; each Death Knight specialization lists
 * only its own, so the enrichers build activities for the runes the feature's own text names.
 */
export type TRune = "Blood" | "Frost" | "Unholy";

export const RUNES: TRune[] = ["Blood", "Frost", "Unholy"];

/** The runes a feature's description names as option headings ("Blood." / "Frost." / "Unholy."). */
export function runesInText(html: string | null | undefined): TRune[] {
  const text = (html ?? "").replace(/<[^>]+>/g, " ");
  return RUNES.filter((rune) => new RegExp(`\\b${rune}\\.\\s`).test(text));
}

/**
 * The runes a rune feature covers. DDB models the Death Knight's rune as a choice whose options are
 * named "Blood", "Runic Power: Blood" and so on, and the specialization text has no rune headings,
 * so the chosen option wins (the option labels in `_chosen`, then the document names, since the
 * parent pass builds before the option rename), then the text, then the Death Knight specialization's name
 * ("Blood Specialization"), and all three when none says.
 */
export function runesFor({ names = [], html, subclassName }: {
  names?: (string | null | undefined)[];
  html?: string | null;
  subclassName?: string | null;
}): TRune[] {
  const fromName = RUNES.filter((rune) =>
    names.some((name) => new RegExp(`(^|: )${rune}$`).test((name ?? "").trim())),
  );
  if (fromName.length > 0) return fromName;
  const fromText = runesInText(html);
  if (fromText.length > 0) return fromText;
  const fromSubclass = RUNES.filter((rune) => (subclassName ?? "").startsWith(`${rune} Specialization`));
  if (fromSubclass.length > 0) return fromSubclass;
  return RUNES;
}
