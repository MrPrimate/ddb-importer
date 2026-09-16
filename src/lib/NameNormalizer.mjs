// These are split out in pure JS for the icon matcher tool

/** Decode DDB name entities without changing the importer's matching semantics.
 * @param {string} str
 * @returns {string}
 */
export function nameString(str) {
  return str
    .replaceAll("&amp;", "&")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&eacute;", "é")
    .replaceAll("&ucirc;", "û")
    .replaceAll("&iacute;", "í")
    .replaceAll("&shy;", "")
    .replaceAll("&hellip;", "...")
    .replaceAll(/&mdash;|&ndash;/g, "-")
    .replaceAll(/&ldquo;|&rdquo;/g, "\"")
    .replaceAll("&rsquo;", "'")
    .replaceAll("’", "'")
    .replaceAll("  ", " ").trim();
}
