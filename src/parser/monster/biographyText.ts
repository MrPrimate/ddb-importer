/**
 * Splits the biography block from a D&D Beyond monster web page into the two source fields the
 * monster parser reads. Some monsters (many 2024 Monster Manual entries) ship an empty
 * `characteristicsDescription` and `lairDescription` from the API although the page shows both.
 *
 * The lair section is the `<h3>` whose title ends in "Lair" or "Lairs" ("Red Dragon Lairs") up to
 * the next `<h3>`, heading included, which is the shape the API uses for `lairDescription`.
 * @param html the inner HTML of the page's biography block
 * @returns the whole biography, and the lair section or an empty string when there is none
 */
export function splitMonsterBiography(html: string): { biography: string; lair: string } {
  const biography = html.trim();
  const headings = [...biography.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi)];
  const lairHeading = headings.find((heading) => (/\blairs?\s*$/i).test(heading[1].replace(/<[^>]+>/g, "").trim()));
  if (!lairHeading || lairHeading.index === undefined) return { biography, lair: "" };

  const start = lairHeading.index;
  const next = headings.find((heading) => heading.index !== undefined && heading.index > start);
  const lair = biography
    .slice(start, next?.index ?? biography.length)
    .replace(/(?:\s*<hr\s*\/?>)+\s*$/i, "")
    .trim();
  return { biography, lair };
}
