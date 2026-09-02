import logger from "../../lib/Logger";
import utils from "../../lib/Utils";
import { DICTIONARY } from "../../config/_module";
import SystemHelpers from "../../lib/SystemHelpers";
import AutoEffects from "../enrichers/effects/AutoEffects";

/** A dwescription section label found in a DDB description or snippet. */
interface ISectionMarker {
  /** index just past the label, where the section's rules text starts */
  end: number;
  /** index the previous section ends at: the label, or the block/blank line opening it */
  boundaryStart: number;
  /** the block tag opening the label's block, restored onto an extracted fragment */
  blockOpen: string | null;
  blockTag: string | null;
  /** heading (3) > strong/b (2) > em/i/u (1); a section ends at an equal or stronger label */
  rank: number;
  /** normalized label text */
  name: string;
  /** the label as DDB wrote it, for naming a generated activity */
  rawLabel: string;
}

export default class DDBDescriptions {

  static DEFAULT_DURATION_SECONDS = 60;

  /**
   * Normalize a section label or activity name for comparison: strip tags,
   * decode common entities, collapse whitespace, drop trailing punctuation and
   * lowercase. A regex tag strip is used instead of a DOM round-trip so this
   * stays usable in DOM-less environments; numeric entities and &nbsp; are
   * decoded here because they fall outside utils.nameString's short list.
   */
  static normalizeSectionLabel(value: string): string {
    const stripped = value
      .replace(/<[^>]*>/g, "")
      .replace(/&#(\d+);/g, (_match, dec: string) => String.fromCodePoint(Number(dec)))
      .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/&nbsp;/gi, " ");
    return utils.nameString(stripped)
      .replace(/\s+/g, " ")
      .replace(/[.:;!?]+$/g, "")
      .trim()
      .toLowerCase();
  }

  static #BLOCK_MARKUP_REGEX = /<(?:p|div|ul|ol|table|li|blockquote|h[1-6])\b/i;

  static #INLINE_EMPHASIS_REGEX = /<(?:strong|b|em|i|u)\b/i;

  // Words that may stay lowercase inside a Title Case section label.
  static #LABEL_MINOR_WORDS = new Set([
    "a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "into", "nor", "of", "on",
    "or", "the", "to", "up", "with",
  ]);

  /**
   * Does this phrase look like a DDB section label rather than an ordinary sentence?
   * DDB writes the handful of unemphasised snippet subsections as a short Title Case
   * phrase followed by a period, so "Bolstering Treats." is a label while
   * "You gain proficiency with Cook's Utensils." is not.
   */
  static #isSectionLabel(label: string): boolean {
    const words = label.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0 || words.length > 8) return false;
    return words.every((word, index) => {
      const stripped = word.replace(/^[^\p{L}\p{N}]+/u, "");
      if (!stripped) return false;
      if (index > 0 && DDBDescriptions.#LABEL_MINOR_WORDS.has(stripped.toLowerCase())) return true;
      return (/^[\p{Lu}\p{N}]/u).test(stripped);
    });
  }

  /**
   * Rebuild the paragraph structure of a DDB snippet. Snippets are inline html - bold
   * section labels, but no block tags - whose paragraph breaks are literal blank lines
   * and whose line breaks are single newlines. Dropped straight into an HTMLField those
   * collapse and the whole snippet renders as one run-on block. The ~1% of snippets that
   * already carry block markup are returned untouched.
   *
   * Blocks are joined with a newline rather than butted together so that a tag-stripped
   * comparison (utils.stringKindaEqual, normalizeSectionLabel) still yields the same
   * words as the raw source.
   */
  static snippetToHtml(text: string): string {
    if (!text?.trim()) return text;
    if (DDBDescriptions.#BLOCK_MARKUP_REGEX.test(text)) return text;

    const blocks = text
      .replace(/\r\n?/g, "\n")
      .split(/\n[ \t]*\n+/)
      .map((block) => block.trim())
      .filter((block) => block !== "");
    if (blocks.length === 0) return text;

    return blocks
      .map((block) => {
        const lines = block.split(/\n[ \t]*/).map((line) => DDBDescriptions.#emphasizeSectionLabel(line));
        return `<p>${lines.join("<br>")}</p>`;
      })
      .join("\n");
  }

  /**
   * Emphasise a bare section label so it reads like the emphasised ones DDB ships on most
   * snippets. Only applied to blocks carrying no emphasis of their own
   */
  static #emphasizeSectionLabel(block: string): string {
    if (DDBDescriptions.#INLINE_EMPHASIS_REGEX.test(block)) return block;
    const match = (/^([A-Z][^.!?<>]{2,60})\.\s+(?=\S)/).exec(block);
    if (!match || !DDBDescriptions.#isSectionLabel(match[1])) return block;
    return `<strong>${match[1]}.</strong> ${block.slice(match[0].length)}`;
  }

  static #SECTION_BLOCK_TAG_REGEX = /<(\/?)(ul|ol|table|tbody|thead|tr|li|p|div|blockquote|td|th)\b[^>]*>/gi;

  /**
   * Remove block tags that are unbalanced within an extracted fragment:
   * closing tags whose opener sits outside the slice (the marker's containing
   * list/paragraph/table) and bare trailing container openers that belong to
   * the following section. Content-bearing unclosed blocks are kept - a
   * browser auto-closes those.
   */
  static #balanceSectionFragment(fragment: string): string {
    const removals: { index: number; length: number }[] = [];
    const stack: string[] = [];
    for (const match of fragment.matchAll(DDBDescriptions.#SECTION_BLOCK_TAG_REGEX)) {
      if (match.index === undefined) continue;
      const tag = match[2].toLowerCase();
      if (!match[1]) {
        stack.push(tag);
        continue;
      }
      const openIndex = stack.lastIndexOf(tag);
      if (openIndex === -1) {
        removals.push({ index: match.index, length: match[0].length });
      } else {
        // Anything the close skips over is treated as auto-closed.
        stack.splice(openIndex);
      }
    }
    for (const removal of removals.sort((a, b) => b.index - a.index)) {
      fragment = fragment.slice(0, removal.index) + fragment.slice(removal.index + removal.length);
    }
    return fragment.replace(/(?:<(?:ul|ol|table|tbody|thead|tr)\b[^>]*>\s*)+$/i, "").trim();
  }

  /**
   * Collect the section markers in a piece of DDB HTML. DDB commonly represents feature
   * subsections as a bold or italic label at the start of a paragraph/list item, or - in
   * snippets, which carry inline markup only - at the start of a blank-line-separated
   * block. A section ends at the next label of equal or stronger emphasis
   * (heading > strong/b > em/i/u); a weaker label - e.g. an italicised spell name opening
   * a paragraph inside a bold-labelled section - and inline emphasis such as a bold
   * damage die are not boundaries.
   */
  static #htmlSectionMarkers(html: string): ISectionMarker[] {
    const markerRegex = /<(h[1-6]|strong|b|em|i|u)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi;
    // A snippet has no block tags at all: its paragraph breaks are blank lines
    const blockStartRegex
      = /(?:^|(?<open><(?<block>p|li|div|blockquote|td|th)\b[^>]*>)|<br\b[^>]*>|\r?\n[ \t]*\r?\n)\s*$/i;
    const rankOf = (tag: string): number => {
      if (tag.startsWith("h")) return 3;
      return tag === "strong" || tag === "b" ? 2 : 1;
    };
    const markers: ISectionMarker[] = [];

    for (const match of html.matchAll(markerRegex)) {
      if (match.index === undefined) continue;
      const tag = match[1].toLowerCase();
      const isHeading = tag.startsWith("h");
      // A block boundary sits adjacent to its marker, so a bounded window
      // keeps the scan linear over long descriptions.
      const windowStart = Math.max(0, match.index - 256);
      const prefix = html.slice(windowStart, match.index);
      const blockStart = blockStartRegex.exec(prefix);

      // Strong/emphasized prose inside a section is not a new section.
      if (!isHeading && !blockStart) continue;

      markers.push({
        end: match.index + match[0].length,
        boundaryStart: isHeading ? match.index : windowStart + blockStart!.index,
        blockOpen: isHeading ? null : blockStart?.groups?.open ?? null,
        blockTag: isHeading ? null : blockStart?.groups?.block?.toLowerCase() ?? null,
        rank: rankOf(tag),
        name: DDBDescriptions.normalizeSectionLabel(match[2]),
        rawLabel: DDBDescriptions.#rawSectionLabel(match[2]),
      });
    }

    return markers;
  }

  /**
   * The label as DDB wrote it, minus markup and the punctuation that terminates it.
   * DDB labels sections "Frost Shot." or "Splashing Mucous (1 Charge):", and a generated
   * activity wants the words without either terminator; the case is kept so the activity
   * reads "Frost Shot" rather than the lowercased form used for matching.
   */
  static #NAMED_ENTITIES: Record<string, string> = {
    amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ",
    ldquo: "\u201c", rdquo: "\u201d", lsquo: "\u2018", rsquo: "\u2019",
    hellip: "\u2026", ndash: "\u2013", mdash: "\u2014",
  };

  static #rawSectionLabel(value: string): string {
    return value
      .replace(/<[^>]*>/g, "")
      .replace(/&#(\d+);/g, (_match, dec: string) => String.fromCodePoint(Number(dec)))
      .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
      // named entities are decoded before the terminator strip, or "&rdquo;" loses its semicolon
      .replace(/&([a-z]+);/gi, (match, name: string) => DDBDescriptions.#NAMED_ENTITIES[name.toLowerCase()] ?? match)
      .replace(/\s+/g, " ")
      .trim()
      // DDB quotes a spoken command word as its own label: <strong>"Cower."</strong>
      .replace(/^["'\u201c\u2018]+/, "")
      .replace(/["'\u201d\u2019]+$/, "")
      .replace(/[.:;!?]+$/g, "")
      .trim();
  }

  /**
   * Collect the section markers in a snippet whose labels carry no markup at all - a small
   * tail of DDB's features. In tehse cases a label is then a short Title Case phrase terminated by a period
   * at the start of the text or of a line. Some internal candidates are not considered: ordinary prose produces too many of them to use as section boundaries.
   */
  static #plainSectionMarkers(text: string): ISectionMarker[] {
    const markerRegex = /(?:^|\r?\n)[ \t]*([^\s.!?<>][^.!?<>]{1,59})\.(?=\s|$)\s*/g;
    const markers: ISectionMarker[] = [];

    for (const match of text.matchAll(markerRegex)) {
      if (match.index === undefined) continue;
      const label = match[1];
      if (!DDBDescriptions.#isSectionLabel(label)) continue;
      const leading = match[0].length - match[0].trimStart().length;
      markers.push({
        end: match.index + match[0].length,
        boundaryStart: match.index + leading,
        blockOpen: null,
        blockTag: null,
        rank: 2,
        name: DDBDescriptions.normalizeSectionLabel(label),
        rawLabel: DDBDescriptions.#rawSectionLabel(label),
      });
    }

    return markers;
  }

  static #sectionMarkers(source: string): ISectionMarker[] {
    const htmlMarkers = DDBDescriptions.#htmlSectionMarkers(source);
    if (htmlMarkers.length > 0) return htmlMarkers;
    return DDBDescriptions.#plainSectionMarkers(source);
  }

  /**
   * How many section labels does this text carry?
   * Used to spot a multi-section block of rules text that describes a whole feature rather than one of its activities.
   */
  static sectionLabelCount(source: string): number {
    if (!source?.trim()) return 0;
    return new Set(DDBDescriptions.#sectionMarkers(source).map((marker) => marker.name)).size;
  }

  /**
   * Locate the marker for an activity.
   * An exact label match wins; failing that a label wholly contained in the activity name does
   * e.g. DDB labels the Chef feat's rules "Bolstering Treats" while the activity that creates them is "Create Bolstering Treats".
   * Single-word labels are too weak to match.
   */
  static #findSectionMarker(markers: ISectionMarker[], normalizedName: string, exactOnly: boolean): number {
    const exact = markers.findIndex((marker) => marker.name === normalizedName);
    if (exact !== -1 || exactOnly) return exact;

    let best = -1;
    let bestLength = 0;
    let tied = false;
    markers.forEach((marker, index) => {
      if (marker.name.split(" ").filter(Boolean).length < 2) return;
      if (!` ${normalizedName} `.includes(` ${marker.name} `)) return;
      if (marker.name.length < bestLength) return;
      // two labels of equal weight both fit the name: attaching either would be a guess
      tied = marker.name.length === bestLength;
      best = index;
      bestLength = marker.name.length;
    });
    return tied ? -1 : best;
  }

  // Activity names carry a parenthesised qualifier to tell siblings apart - "Autumn (Save)",
  // "Summer (Damage)", "Fey Step (Teleport)". DDB never labels a section that way, so the
  // qualifier is dropped for a second lookup pass.
  static #ACTIVITY_QUALIFIER_REGEX = /\s*\([^()]*\)\s*$/;

  /**
   * Locate the section of a DDB description or snippet that describes an activity, and
   * return its label alongside the rules text.
   * An exact label match wins; failing that, and unless exactOnly is set, a label wholly contained in the activity name does.
   * Each pass is tried against the full activity name first, then against the name with its parenthesised qualifier removed.
   */
  static matchActivitySection(
    source: string, activityName: string, { exactOnly = false } = {},
  ): { label: string; section: string } | null {
    if (!source?.trim() || !activityName?.trim()) return null;

    const candidates = [activityName, activityName.replace(DDBDescriptions.#ACTIVITY_QUALIFIER_REGEX, "")]
      .map((name) => DDBDescriptions.normalizeSectionLabel(name))
      .filter((name, index, names) => name !== "" && names.indexOf(name) === index);
    if (candidates.length === 0) return null;

    const markers = DDBDescriptions.#sectionMarkers(source);
    let targetIndex = -1;
    for (const candidate of candidates) {
      targetIndex = DDBDescriptions.#findSectionMarker(markers, candidate, exactOnly);
      if (targetIndex !== -1) break;
    }
    if (targetIndex === -1) return null;

    const section = DDBDescriptions.#sliceSection(source, markers, targetIndex);

    return section ? { label: markers[targetIndex].name, section } : null;
  }

  /**
   * The rules text belonging to one marker: everything up to the next marker of equal or
   * greater emphasis, returned as a html fragment.
   */
  static #sliceSection(source: string, markers: ISectionMarker[], index: number): string {
    const target = markers[index];
    const next = markers.slice(index + 1).find((marker) => marker.rank >= target.rank);
    let section = source.slice(target.end, next?.boundaryStart ?? source.length).trim();

    // Restore the partial block containing an inline heading so the result is
    // valid HTML; a list-item label is left for the balancer, which strips the
    // dangling </li>
    if (target.blockOpen && target.blockTag !== "li") {
      section = `${target.blockOpen}${section}`;
      const emptyBlock = new RegExp(`^<${target.blockTag}\\b[^>]*>\\s*</${target.blockTag}>\\s*`, "i");
      section = section.replace(emptyBlock, "");
    }

    return DDBDescriptions.#balanceSectionFragment(section);
  }

  /**
   * Every section of a DDB description, in source order.
   *
   * Only the markers at the strongest rank present are treated as boundaries, so a bold
   * "Frost Shot." opens a section while an italicised spell name inside it does not. This is
   * the enumerate-all sibling of {@link matchActivitySection}, which looks one section up by
   * name; callers that need to act on each mode of a multi-mode item want this one.
   */
  static sections(source: string): ISectionSlice[] {
    if (!source?.trim()) return [];
    const markers = DDBDescriptions.#sectionMarkers(source);
    if (markers.length === 0) return [];

    const topRank = Math.max(...markers.map((marker) => marker.rank));
    const slices: ISectionSlice[] = [];
    markers.forEach((marker, index) => {
      if (marker.rank !== topRank) return;
      const section = DDBDescriptions.#sliceSection(source, markers, index);
      if (!section) return;
      slices.push({
        label: marker.name,
        rawLabel: marker.rawLabel,
        section,
        start: marker.boundaryStart,
      });
    });

    return slices;
  }

  /** The rules text of {@link matchActivitySection}, for callers that do not need the label. */
  static extractActivitySection(source: string, activityName: string, { exactOnly = false } = {}): string | null {
    return DDBDescriptions.matchActivitySection(source, activityName, { exactOnly })?.section ?? null;
  }

  /** Alternation of the six ability long names, for the save-parsing regexes. */
  static SAVE_ABILITY_NAMES = DICTIONARY.actor.abilities.map((ability) => ability.long).join("|");

  /**
   * Map long ability names captured from a description to system keys, dropping
   * anything that is not one of the six abilities. `save.ability` is a choice
   * list, so "Strength or Dexterity saving throw" legitimately yields two.
   */
  static saveAbilityKeys(...names: (string | undefined)[]): string[] {
    return names.reduce((keys: string[], name) => {
      const key = DICTIONARY.actor.abilities.find((ability) => ability.long === name?.toLowerCase())?.value;
      if (key && !keys.includes(key)) keys.push(key);
      return keys;
    }, []);
  }

  /**
   * Rules text with its markup and entities resolved, for the regexes that read a whole sentence.
   * Block tags become spaces so two paragraphs never run their last and first words together.
   */
  static plainText(source: string): string {
    return (source ?? "")
      .replace(/<(?:br|\/?p|\/?div|\/?li|\/?ul|\/?ol|\/?tr|\/?td|\/?th|\/?table|\/?h[1-6]|\/?blockquote)\b[^>]*>/gi, " ")
      .replace(/<[^>]*>/g, "")
      .replace(/&#(\d+);/g, (_match, dec: string) => String.fromCodePoint(Number(dec)))
      .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/&([a-z]+);/gi, (match, name: string) => DDBDescriptions.#NAMED_ENTITIES[name.toLowerCase()] ?? match)
      .replace(/\s+/g, " ")
      .trim();
  }

  static #HALF_ON_SAVE_REGEX = /or half as much damage on a successful one|Success: Half damage/i;

  /** Does this text say a successful save halves the damage? */
  static halfOnSave(text: string): boolean {
    return DDBDescriptions.#HALF_ON_SAVE_REGEX.test(text ?? "");
  }

  /** Remove `<table>` blocks, whose saves are rows of a random table rather than properties. */
  static stripTables(text: string): string {
    return (text ?? "").replace(/<table[\s\S]*?<\/table>/gi, " ");
  }

  /**
   * Every saving throw named in a piece of rules text, in source order.
   *
   * Unlike {@link DDBDescriptions.dcParser} and `DDBItem.parseSaveFromDescription`, which stop at
   * the first match, this collects them all so a caller can build one activity per property of a
   * multi-mode item. Abilities are matched against the whitelist alternation rather than a `\w+`
   * wildcard: a wildcard swallows the "DC 15 " prefix and pairs a DC with an ability from a
   * different sentence.
   *
   * Both printings' word orders are read - the 2014 "DC 15 Dexterity saving throw" and the 2024
   * "Dexterity Saving Throw: DC 15" - plus the spell-save-DC phrasing, which has a  `calculation` instead of a `formula`.
   */
  static parseSaves(source: string): IParsedSave[] {
    if (!source?.trim()) return [];
    // Tags are stripped before matching: DDB splits the 2024 wording across markup
    // ("<em>Dexterity Saving Throw:</em> DC 18"), which no single regex can span. A regex strip
    // rather than a DOM round-trip keeps this usable in DOM-less environments.
    const text = DDBDescriptions.plainText(source);
    const abilities = DDBDescriptions.SAVE_ABILITY_NAMES;
    const half = DDBDescriptions.halfOnSave(text);
    const saves: IParsedSave[] = [];
    // Several patterns can describe one sentence; the first to claim a span of the text owns it,
    // so an explicit DC is never re-read as a bare spell-save phrasing.
    const claimed: { start: number; end: number }[] = [];

    const push = (match: RegExpExecArray | RegExpMatchArray, ability: string[], calculation: string, formula: string): void => {
      if (ability.length === 0) return;
      const start = match.index ?? 0;
      const end = start + match[0].length;
      if (claimed.some((span) => start < span.end && end > span.start)) return;
      claimed.push({ start, end });
      saves.push({ ability, dc: { calculation, formula }, index: start, half });
    };

    const explicit = new RegExp(`DC (\\d+) (${abilities})(?: or (${abilities}))? sav(?:e|ing throw)`, "gi");
    for (const match of text.matchAll(explicit)) {
      push(match, DDBDescriptions.saveAbilityKeys(match[2], match[3]), "", match[1]);
    }

    const explicit2024 = new RegExp(`(${abilities})(?: or (${abilities}))? Saving Throw: DC (\\d+)`, "gi");
    for (const match of text.matchAll(explicit2024)) {
      push(match, DDBDescriptions.saveAbilityKeys(match[1], match[2]), "", match[3]);
    }

    const spellSave = new RegExp(
      `(${abilities})(?: or (${abilities}))? sav(?:e|ing throw)[^.]{0,40}?against your spell save DC`, "gi",
    );
    for (const match of text.matchAll(spellSave)) {
      push(match, DDBDescriptions.saveAbilityKeys(match[1], match[2]), "spellcasting", "");
    }

    return saves.sort((a, b) => a.index - b.index);
  }

  /** Two saves are the same property when they ask for the same roll against the same DC. */
  static saveKey(save: { ability?: string[] | null; dc?: { calculation?: string; formula?: string } | null }): string {
    const ability = [...(save.ability ?? [])].sort().join("+");
    return `${save.dc?.calculation ?? ""}|${save.dc?.formula ?? ""}|${ability}`;
  }

  // The damage expression the item parser uses.
  //
  // eslint-disable-next-line no-useless-escape
  static DAMAGE_EXPRESSION = /(?<prefix>(?:takes|taking|saving throw (?:\([\w ]*\) )?or take\s+)|(?:[\w]*\s+))(?:(?<flat>[0-9]+))?(?:\s*\(?(?<damageDice>[0-9]+d[0-9]+(?:\s*[-+]\s*(?:[0-9]+))*(?:\s+plus [^\)]+)?)\)?)\s*(?<type>[\w ]*?)\s*damage(?<start>\sat the start of|\son a failed save)?/gi;

  /**
   * Read damage out of rules text.
   *
   * `parts` is the damage the roll deals;
   * `otherParts` is everything the text describes as a separate calculation - an ongoing tick, or a second damage entry
   *    on a save-based effect once the first has been claimed.
   * `parseDice` decides whether dice strings are normalised through `utils.parseDiceString`, which the item parser
   *    only does when it has action data.
   */
  static parseDamageParts(text: string, { parseDice = true } = {}): {
    parts: I5eDamagePart[];
    otherParts: I5eDamagePart[];
  } {
    const parts: I5eDamagePart[] = [];
    const otherParts: I5eDamagePart[] = [];
    if (!text?.trim()) return { parts, otherParts };

    const description = utils.stripHtml(text).replace(/[–-–−]/g, "-");
    const matches = [...description.matchAll(DDBDescriptions.DAMAGE_EXPRESSION)];

    for (const dmg of matches) {
      if (!dmg.groups) continue; // the regex defines named groups, so this always exists
      let other = false;
      if (dmg.groups.prefix == "DC " || dmg.groups.type == "hit points by this") {
        continue;
      }
      // check for other
      if (dmg.groups.start && dmg.groups.start.trim() == "at the start of") other = true;
      const damage = dmg.groups.damageDice ?? dmg.groups.flat;

      // Make sure we did match a damage
      if (damage) {
        const includesDiceRegExp = /[0-9]*d[0-9]+/;
        const includesDice = includesDiceRegExp.test(damage);
        const finalDamage = (parseDice && includesDice)
          ? utils.parseDiceString(damage.replace("plus", "+"), "").diceString
          : damage.replace("plus", "+");

        const part = SystemHelpers.buildDamagePart({ damageString: finalDamage, type: dmg.groups.type, stripMod: false });

        // if this is a save based attack, and multiple damage entries, we assume any entry beyond the first is going into a second damage calculation
        // ignore if dmg[1] is and as it likely indicates the whole thing is a save
        if ((((dmg.groups.start ?? "").trim() == "on a failed save" && (dmg.groups.prefix ?? "").trim() !== "and")
            || (dmg.groups.prefix && dmg.groups.prefix.includes("saving throw")))
          && parts.length >= 1
        ) {
          other = true;
        }
        // assumption here is that there is just one field added to versatile. this is going to be rare.
        if (other) {
          otherParts.push(part);
        } else {
          parts.push(part);
        }
      }
    }

    return { parts, otherParts };
  }

  static startOrEnd(text: string) {
    const re = /at the (start|end) of each/i;
    const match = text.match(re);
    if (match) {
      return match[1];
    } else {
      return undefined;
    }
  }

  /**
   * References that name the creature the effect is ON. "until the end of the
   * creature's next turn" anchors on the target.
   */
  static NEXT_TURN_TARGET_REFERENTS = [
    "it", "its", "the target", "the target's", "that target", "that target's",
    "the creature", "the creature's", "that creature", "that creature's",
    "their", "them", "the attacker", "the attacker's", "the victim", "the victim's",
  ];

  /**
   * References that name the creature the effect came FROM. DDB rules
   * text names the ACTING creature specifically ("the demilich's next turn",
   * "the ranger's", "the aberration's") while referring to the thing affected
   * generically ("the creature", "the target"). So any unrecognised POSSESSIVE
   * noun phrase is treated as the source; a reference that is neither generic nor
   * possessive yields no expiry
   */
  static NEXT_TURN_SOURCE_REFERENTS = ["your", "the caster", "the summoner"];

  /** "the demilich's", "stokkvari's", "the boss' " - a possessive noun phrase. */
  static POSSESSIVE_REFERENT = /(?:'s|s')$/;

  /**
   * Parse a "until the start/end of X's next turn" clause into native `duration.expiry`.
   * Adjective-qualified generic referents ("the chosen creature's", "the hit creature's")
   * reduce to their first noun before lookup. Returns null when the referent is not recognised
   */
  static nextTurnExpiry(text: string): { expiry: T5eEffectExpiry; dae: string; special: string } | null {
    // real newlines and non-breaking spaces can break a clause that spans a line
    const cleaned = utils.nameString(text).replace(/[\s\u00a0]+/g, " ");
    const re = /until the (?<point>end|start|beginning) of (?<whos>[^.,;:]{1,40}?) next turn/i;
    const match = re.exec(cleaned);
    if (!match?.groups) return null;

    const point = match.groups.point === "end" ? "End" : "Start";
    const referent = match.groups.whos.toLowerCase().trim();
    // "the chosen/hit/frightened creature's" -> "the creature's"
    const generic = referent.replace(
      /^(the|that) \w+ (creature'?s?|target'?s?)$/,
      (_m, article, noun) => `${article} ${noun}`,
    );

    let source: boolean;
    if (DDBDescriptions.NEXT_TURN_TARGET_REFERENTS.includes(generic)) source = false;
    else if (DDBDescriptions.NEXT_TURN_SOURCE_REFERENTS.includes(referent.replace(DDBDescriptions.POSSESSIVE_REFERENT, ""))) source = true;
    else if (DDBDescriptions.POSSESSIVE_REFERENT.test(referent)) source = true;
    else return null;

    const dae = `turn${point}${source ? "Source" : ""}`;
    const expiry = (source ? `source${point}` : `target${point}`) as T5eEffectExpiry;
    return { expiry, dae, special: match[0] };
  }

  static getDuration(text: string, returnDefault = true, generateSpecial = true) {
    const defaultDurationSeconds = 60;
    const result: {
      type: string | null;
      seconds: number | null;
      rounds: number | null;
      minutes: number | null;
      days: number | null;
      years: number | null;
      months: number | null;
      turns: number | null;
      hours: number | null;
      special: string;
      value: string | null;
      units: string;
      dae: string[];
      expiry: T5eEffectExpiry | null;
    } = {
      type: returnDefault ? "second" : null,
      seconds: returnDefault ? defaultDurationSeconds : null,
      rounds: returnDefault ? (defaultDurationSeconds / 6) : null,
      minutes: null,
      days: null,
      years: null,
      months: null,
      turns: null,
      hours: null,
      special: "",
      value: null,
      units: "inst",
      dae: [],
      expiry: null,
    };
    const re = /for (\d+) (minute|hour|round|day|month|year)/; // turn|day|month|year
    const match = text.match(re);
    if (match) {
      let seconds = parseInt(match[1]);
      result.type = match[2];
      result.units = match[2];
      result.value = match[1];
      switch (match[2]) {
        case "minute": {
          result.minutes = parseInt(match[1]);
          seconds *= 60;
          break;
        }
        case "hour": {
          result.hours = parseInt(match[1]);
          seconds *= 60 * 60;
          break;
        }
        case "round": {
          seconds *= 6;
          result.rounds = parseInt(match[1]);
          break;
        }
        case "turn": {
          result.turns = parseInt(match[1]);
          break;
        }
        case "day": {
          result.days = parseInt(match[1]);
          seconds *= 60 * 60 * 24;
          break;
        }
        case "year": {
          result.years = parseInt(match[1]);
          seconds *= 60 * 60 * 24 * 365;
          break;
        }
        case "month": {
          result.months = parseInt(match[1]);
          seconds *= 60 * 60 * 24 * 30;
          break;
        }
        // no default
      }

      result.seconds = seconds;
      return result;
    }


    if (!generateSpecial) return result;

    const nextTurn = DDBDescriptions.nextTurnExpiry(text);
    if (nextTurn) {
      result.type = "special";
      result.units = "spec";
      result.seconds = 6;
      result.rounds = 1;
      result.special = nextTurn.special;
      result.expiry = nextTurn.expiry;
      result.dae = [nextTurn.dae];

      return result;
    }
    return result;
  }

  /**
   * Merge a DAE special duration parsed from a dcParser match tail into an effect.
   *
   * Retained for the public `DDBEffectHelper.getSpecialDuration` API only - the
   * parser itself no longer calls this.
   *
   * Note that `dcParser`'s trailing capture is lazy-optional (`(.*)??`),
   * so `match[7]` is always undefined for matches produced by that regex;
   * only an external caller supplying its own match can reach the classification
   * below.
   *
   * It previously mapped ANY "until the start of the..." to
   * `turnStartSource`, anchoring "the target's next turn" on the
   * caster; it now shares `nextTurnExpiry`'s reference rules.
   */
  static addSpecialDurationFlagsToEffect(effect: I5eEffectData, match: any) {
    const durations: string[] = [];
    const tail = match?.[7];
    if (typeof tail === "string" && tail !== "") {
      const parsed = DDBDescriptions.nextTurnExpiry(tail);
      if (parsed) durations.push(parsed.dae);
    }

    const currentSpecialDurations: TDAESpecialDuration[] = foundry.utils.getProperty(effect, "flags.dae.specialDuration") as TDAESpecialDuration[] ?? [];
    const specialDurations = utils.addArrayToProperties(currentSpecialDurations, durations);
    foundry.utils.setProperty(effect, "flags.dae.specialDuration", specialDurations);
    return effect;
  }

  static getRiderStatusEffects({ text, condition }: { text: string; condition: string }) {
    const checkReg = new RegExp(`While ${condition}, the target has the (.*) condition`, "i");
    const match = checkReg.exec(text);
    if (match) {
      const processedCondition = DDBDescriptions.getConditionInfo(match[1]);
      return processedCondition.condition ? [processedCondition.condition] : [];
    }
    return [];
  }

  // A selection of example conditions
  // DC 18 Strength saving throw or be knocked prone
  // DC 14 Constitution saving throw or become poisoned for 1 minute.
  // DC 12 Constitution saving throw or be poisoned for 1 minute
  // DC 15 Wisdom saving throw or be frightened until the end of its next turn.
  // DC 15 Charisma saving throw or be charmed
  // DC 12 Charisma saving throw or become cursed
  // DC 10 Intelligence saving throw or it can’t take a reaction until the end of its next turn
  // DC 12 Constitution saving throw or contract bluerot
  // DC 17 Strength saving throw or be thrown up to 30 feet away in a straight line
  // DC 13 Constitution saving throw or lose the ability to use reactions until the start of the weird’s
  // DC 16 Wisdom saving throw or move 1 round forward in time
  // DC 15 Constitution saving throw, or for 1 minute, its speed is reduced by 10 feet; it can take either an action or a bonus action on each of its turns, not both; and it can’t take reactions.
  // DC 15 Constitution saving throw or have disadvantage on its attack rolls until the end of its next turn
  // DC 15 Wisdom saving throw or be frightened until the end of its next turn
  // DC 13 Strength saving throw or take an extra 3 (1d6) piercing damage and be grappled (escape DC 13)
  // DC 15 Constitution saving throw or gain 1 level of exhaustion
  // DC 20 Constitution saving throw or be paralyzed for 1 minute
  // DC 17 Constitution saving throw or be cursed with loup garou lycanthropy
  // DC 12 Constitution saving throw or be cursed with mummy rot
  // DC 18 Strength saving throw or be swallowed by the neothelid. A swallowed creature is blinded and restrained, it has total cover against attacks and other effects outside the neothelid, and it takes 35 (10d6) acid damage at the start of each of the neothelid’s turns.</p><p>If the neothelid takes 30 damage or more on a single turn from a creature inside it, the neothelid must succeed on a DC 18 Constitution saving throw at the end of that turn or regurgitate all swallowed creatures, which fall prone in a space within 10 feet of the neothelid. If the neothelid dies, a swallowed creature is no longer restrained by it and can escape from the corpse by using 20 feet of movement, exiting prone.
  // (before DC) it can’t regain hit points for 1 minute
  // DC 14 Dexterity saving throw or suffer one additional effect of the shadow dancer’s choice:</p><ul>\n<li>The target is grappled (escape DC 14) if it is a Medium or smaller creature. Until the grapple ends, the target is restrained, and the shadow dancer can’t grapple another target.</li>\n<li>The target is knocked prone.</li>\n<li>The target takes 22 (4d10) necrotic damage.</li>\n</ul>\n</section>\nThe Shadow Dancer attacks with its Spiked Chain.
  // DC 15 Constitution saving throw or be stunned until the end of its next turn.
  // DC 15 Constitution saving throw or die.
  // DC 20 Strength saving throw or be pulled up to 25 feet toward the balor.
  // DC 11 Constitution saving throw or be poisoned until the end of the target’s next turn.
  // DC 14 Wisdom saving throw or be frightened of the quori for 1 minute.
  // DC 13 Constitution saving throw or be poisoned for 1 hour. If the saving throw fails by 5 or more, the target is also unconscious while poisoned in this way. The target wakes up if it takes damage or if another creature takes an action to shake it awake.


  static dcParser({ text }: { text: string }): IDCParserResult {
    const results: IDCParserResult = {
      save: {
        dc: {
          formula: "",
          calculation: "",
        },
        ability: [],
      },
      match: null,
      damageAndSave: false,
      duration: {
        type: null,
        value: null,
      },
      damage: {
        type: null,
        value: null,
      },
      riderStatuses: [],
    };

    const parserText = utils.nameString(text)
      .replaceAll("[condition]", "")
      .replaceAll("[/condition]", "")
      .replaceAll("[save]", "")
      .replaceAll("[/save]", "")
      .replaceAll("[/action]", "")
      .replaceAll("[action]", "");
    const conditionSearch = /\[\[\/save (?<ability>\w+) (?<dc>\d\d) format=long\]\](?:,)? or (?<hint>have the|be |be cursed|become|die|contract|have|it can't|suffer|gain|lose the)\s?(?:knocked )?(?:&(?:amp;)?Reference\[(?<condition>\w+)\]{\w+})?\s?(?:for (?<durationUnits>\d+) (?<durationType>minute|round|hour)| until)?(.*)??(?:.|$)/ig;
    let match = conditionSearch.exec(parserText);
    if (!match) {
      // "against this magic" is common 2014 monster phrasing (Dreadful Glare)
      const rawConditionSearch = /DC (?<dc>\d+) (?<ability>\w+) (?<type>saving throw|check)(?:,| against this magic)? or (?<hint>have the|be |be cursed|become|die|contract|have|it can't|suffer|gain|lose the)\s?(?:knocked )?(?<condition>\w+)?\s?(?:for (?<durationUnits>\d+) (?<durationType>minute|round|hour)| until)?(.*)??(?:.|$)/ig;
      match = rawConditionSearch.exec(parserText);
    }

    if (!match) {
      const rawNoDC = /(?<ability>\w+)? (?<type>saving throw|check)(?:,| against this magic)? or (?<hint>have the|be |be cursed|become|die|contract|have|it can't|suffer|gain|lose the)\s?(?:knocked )?(?<condition>\w+)?\s?(?:for (\d+)\s?(?<durationType>minute|round|hour)| until)?(.*)??(?:.|$)/ig;
      match = rawNoDC.exec(parserText);
    }

    if (!match) {
      const rawDamageConditionSearch = /DC (?<dc>\d+) (?<ability>\w+) (?<type>saving throw|check)(?:,| against this magic)? or take (?<fixed>\d+) \((?<damageValue>\d+d\d+)\) (?<damageType>\w+) damage and (?<hint>have the|then be|be |be cursed|become|die|contract|have|it can't|suffer|gain|lose the)\s?(?:knocked )?(?<condition>\w+)?\s?(?:for (?<durationUnits>\d+) (?<durationType>minute|round|hour)| until)?(.*)?(?:.|$)/ig;
      match = rawDamageConditionSearch.exec(parserText);
      if (match?.groups) {
        results.damageAndSave = true;
        results.damage = {
          type: match.groups.damageType.trim(),
          value: match.groups.damageValue.trim(),
        };
      }
    }

    if (!match) {
      const rawConditionSearch2 = /(?<ability>\w+) (?<type>saving throw|check): DC (?<dc>\d+)(?:[ .,])(.*)Failure: The target has the (?<condition>\w+)(?: for (?<durationUnits>\d+) (?<durationType>minute|round|hour)| until)?/ig;
      match = rawConditionSearch2.exec(parserText);
    }

    if (!match) {
      const monsterAndCondition = /(the target has the|subject that creature to the|it has the) (?<condition>\w+) condition/ig;
      match = monsterAndCondition.exec(parserText);
    }

    if (!match) {
      const onHitSearch = /On a hit, the target is (?<condition>\w+)? until/ig;
      match = onHitSearch.exec(parserText);
    }

    if (!match) {
      const saveSearch = /On a failed save, a creature takes (\d+)?d(\d+) (\w+) damage and is (?<condition>\w+)(?: for (?<durationUnits>\d+) (?<durationType>minute|round|hour))?/ig;
      match = saveSearch.exec(parserText);
    }

    if (!match) {
      const saveSearch = /On a failed save, (?:a|the) creature takes (\d+)?d(\d+) (\w+) damage and has the (?<condition>\w+) condition until the (?<specialDuration>\w+) of your next turn/ig;
      match = saveSearch.exec(parserText);
    }

    if (!match) {
      const successSearch = /succeed on a (?<ability>\w+) (?<type>saving throw|check) \(DC 8 plus your (?<modifier>\w+) modifier and Proficiency Bonus\) or (?:have the) (?<condition>\w+) condition until /ig;
      match = successSearch.exec(parserText);
    }

    if (!match) {
      const successSearch = /succeed on a (?<ability>\w+) (?<type>saving throw|check)(?: \(DC equal to 8 \+ your proficiency bonus \+ your (?<modifier>\w+) modifier\))? or (?:be|become) (?<condition>\w+) (of you )?until /ig;
      match = successSearch.exec(parserText);
    }

    if (!match) {
      const snippetSearch = /succeed on a (?<ability>\w+) (?<type>saving throw|check) \(DC {{savedc:(?<modifier>\w+)}}\)? or be (?<condition>\w+) until/ig;
      match = snippetSearch.exec(parserText);
    }

    if (!match) {
      const spellcasterSearch = /a (?<ability>\w+) (?<type>saving throw|check) against your (?<spellcasting>spell save DC|spellcasting|spell casting)/ig;
      match = spellcasterSearch.exec(parserText);
    }

    if (!match) {
      const paladinMatch = /a (?<ability>\w+) (?<type>saving throw|check). On a failed save, a creature becomes (?<condition>\w+)(?: of|.| )/ig;
      match = paladinMatch.exec(parserText);
    }

    if (!match) {
      const paladinMatch2 = /a (?<ability>\w+) (?<type>saving throw|check). On a failed save, the attacker/ig;
      match = paladinMatch2.exec(parserText);
    }

    // 2014-era monster phrasings. Kept at the end of the chain so they cannot
    // steal ability/DC captures from the more specific patterns above; a
    // non-condition capture fails the getConditionInfo whitelist harmlessly.
    if (!match) {
      // "If the saving throw fails by 5 or more, the creature is instantly petrified." (2014 Medusa)
      const failsByMatch = /sav(?:e|ing throw) fails(?: by \d+ or more)?, (?:the|a|each) (?:creature|target) (?:is|becomes) (?:instantly |also |magically )?(?<condition>\w+)/ig;
      match = failsByMatch.exec(parserText);
    }

    if (!match) {
      // "On a failed save, the creature magically begins to turn to stone and is restrained." (2014 Basilisk)
      const failedSaveIsMatch = /On a failed save, (?:the|a|each) (?:creature|target)\b[^.]*? (?:is|becomes) (?:instantly |also |magically )?(?<condition>\w+)(?: for (?<durationUnits>\d+) (?<durationType>minute|round|hour)| until)?/ig;
      match = failedSaveIsMatch.exec(parserText);
    }

    if (!match) {
      // "a creature that fails the save begins to turn to stone and is restrained"
      const failsTheSaveMatch = /fails the sav(?:e|ing throw)\b[^.]*? (?:is|becomes) (?:instantly |also |magically )?(?<condition>\w+)/ig;
      match = failsTheSaveMatch.exec(parserText);
    }

    const matchGroups = match?.groups;
    if (match && matchGroups) {
      if (matchGroups.type === "check") results.check = true;
      results.save = {
        dc: {
          formula: matchGroups["dc"] ?? "",
          calculation: matchGroups["spellcasting"] ? "spellcasting" : (matchGroups["modifier"]?.toLowerCase().substring(0, 3) ?? ""),
        },
        ability: matchGroups["ability"] ? [matchGroups["ability"].toLowerCase().substring(0, 3)] : [],
      };
      if (results.save.dc.calculation === "" && results.save.dc.formula === "") {
        if (parserText.toLowerCase().includes("channel divinity)")) {
          results.save.dc.calculation = "spellcasting";
        }
      }
    }

    const conditionGroup = matchGroups?.["condition"];
    if (conditionGroup) {
      results.riderStatuses = DDBDescriptions.getRiderStatusEffects({
        text,
        condition: conditionGroup,
      });
    }

    results.match = match;

    const durationUnits = matchGroups?.durationUnits;
    if (durationUnits) {
      results.duration.units = durationUnits.trim();
    }
    const durationType = matchGroups?.durationType;
    if (durationType) {
      results.duration.type = durationType.trim();
    }

    return results;
  }

  // Non-condition words that describe a rules state carrying a real condition.
  // "or be possessed by the ghost; ... the target is incapacitated and loses
  // control of its body" (2014 Ghost): the first matching phrase captures
  // "possessed", which is mechanically the Incapacitated condition.
  static CONDITION_ALIASES: Record<string, string> = {
    possessed: "incapacitated",
  };

  static getConditionInfo(condition: string, hint?: string): {
    success: boolean;
    condition: string | null;
    group4: boolean | null;
    group4Condition: IDDBDamageAdjustment | null;
    conditionName: string;
  } {
    const result: {
      success: boolean;
      condition: string | null;
      group4: boolean | null;
      group4Condition: IDDBDamageAdjustment | null;
      conditionName: string;
    } = {
      success: true,
      condition: null,
      group4: null,
      group4Condition: null,
      conditionName: utils.capitalize(condition),
    };
    result.condition = condition.toLowerCase();
    // group 4 condition - .e.g. "DC 18 Strength saving throw or be knocked prone"
    const group4Condition = condition
      ? DICTIONARY.actor.damageAdjustments
        .filter((type) => type.type === 4)
        .find(
          (type) => type.name.toLowerCase() === condition.toLowerCase()
            || type.foundryValue === condition.toLowerCase(),
        )
      : undefined;
    const aliasedCondition = DDBDescriptions.CONDITION_ALIASES[condition.toLowerCase()];
    if (group4Condition) {
      result.condition = group4Condition.foundryValue ?? null;
      result.group4 = true;
      result.group4Condition = group4Condition;
      result.conditionName = group4Condition.name;
    } else if (aliasedCondition) {
      const aliasGroup4 = DICTIONARY.actor.damageAdjustments
        .filter((type) => type.type === 4)
        .find((type) => type.foundryValue === aliasedCondition);
      result.condition = aliasedCondition;
      result.group4 = true;
      result.group4Condition = aliasGroup4 ?? null;
      result.conditionName = aliasGroup4?.name ?? utils.capitalize(aliasedCondition);
    } else if (hint === "die") {
      result.condition = "dead";
      result.conditionName = "Dead";
    } else {
      result.success = false;
      logger.debug(`Odd condition ${condition} found`);
    }
    return result;
  }

  static parseStatusCondition({ text }: { text: string }): IParseStatusConditionResult {
    const result: IParseStatusConditionResult = {
      success: false,
      check: false,
      save: {
        dc: {
          formula: "",
          calculation: "",
        },
        ability: null,
      },
      condition: null,
      group4: null,
      group4Condition: null,
      conditionName: null,
      duration: {
        value: null,
        units: null,
      },
      specialDurations: [],
      expiry: null,
      match: null,
      riderStatuses: [],
    };

    const parserText = utils.nameString(text);
    const matchResults = DDBDescriptions.dcParser({ text: parserText });

    // console.warn("condition status", match);
    if (matchResults.match) {
      const match = matchResults.match;
      result.match = match;
      if (match.groups?.type === "check") result.check = true;
      result.save = matchResults.save;

      const condition = match.groups?.["condition"];
      result.condition = condition ?? null;

      if (!condition) {
        logger.debug(`Not condition found`, {
          text,
        });
        return result;
      }

      const parsedCondition = DDBDescriptions.getConditionInfo(condition, match.groups?.hint);
      // console.warn({parsedCondition, matchResults});
      if (parsedCondition.success) {
        result.condition = parsedCondition.condition;
        result.conditionName = parsedCondition.conditionName;
        result.group4 = parsedCondition.group4;
        // group 4 condition - .e.g. "DC 18 Strength saving throw or be knocked prone"
        result.group4Condition = parsedCondition.group4Condition;
      } else {
        logger.debug(`Odd condition ${result.condition} found`, {
          text,
        });
        return result;
      }

      result.success = true;
      const duration = DDBDescriptions.getDuration(parserText);

      if (duration.type && duration.value !== null) {
        result.duration.value = parseInt(duration.value);
        result.duration.units = AutoEffects.adjustDurationUnits(duration.units);
      }
      result.specialDurations = duration.dae ?? [];
      result.expiry = duration.expiry;
    }

    result.riderStatuses = matchResults.riderStatuses;

    return result;
  }


  static featureBasics({ text }: { text: string }): IFeatureBasicsResult {

    const standardMatchRegex = /(?<range>Melee|Ranged|Melee\s+or\s+Ranged)\s+(?<type>|Weapon|Spell)\s*(?<attackRoll>Attack|Attack Roll):\s*(?<bonus>[+-]\d+|your (?:\w+\s*)*)\s*(?<pb>plus PB\s|\+ PB\s)?(?:to\s+hit|,|\(|\.)/i;
    const standardAttackMatches = standardMatchRegex.exec(text);
    const summonAttackRegex = /(?<range>Melee|Ranged|Melee\s+or\s+Ranged)\s+(?<type>|Weapon|Spell)\s*(?<attackRoll>Attack|Attack Roll):\s*(?<spellAttackMod>Bonus equals your spell attack modifier)/i;
    const summonAttackMatches = summonAttackRegex.exec(text);

    const match = standardAttackMatches ?? summonAttackMatches;
    // named groups are always present when these regexes match
    const matchGroups = match?.groups;
    const standardGroups = standardAttackMatches?.groups;
    const summonGroups = summonAttackMatches?.groups;
    const weaponAttack = matchGroups
      ? (matchGroups.type.toLowerCase() === "weapon" || matchGroups.type === "")
      : false;

    const spellAttack = matchGroups ? matchGroups.type.toLowerCase() === "spell" : false;
    const meleeAttack = matchGroups ? matchGroups.range.includes("Melee") : false;
    const rangedAttack = matchGroups ? matchGroups.range.includes("Ranged") : false;

    const pbToAttack = standardGroups ? standardGroups.pb !== undefined : false;
    const yourSpellAttackModToHit = standardGroups?.bonus?.startsWith("your spell")
      ?? Boolean(summonGroups?.spellAttackMod);

    const toHit = standardGroups
      ? Number.isInteger(parseInt(standardGroups.bonus))
        ? parseInt(standardGroups.bonus)
        : 0
      : 0;

    const isSummonAttack = summonGroups
      ? summonGroups.range !== undefined
      : false;

    const isAttack = isSummonAttack
      ? true
      : standardGroups
        ? standardGroups.range !== undefined
        : false;

    const save: IFeatureBasicsSave = {
      ability: [],
      dc: {
        calculation: "",
        formula: "",
      },
      half: false,
    };

    const spellSaveSearch = /(?<ability>\w+) saving throw against your spell save DC/i;
    const spellSave = text.match(spellSaveSearch);
    const summonSaveSearch = /(?<ability>\w+) Saving Throw: DC equals your spell save DC/i;
    const summonSave = text.match(summonSaveSearch);

    const saveSearch = /DC (?<dc>\d+) (?<ability>\w+) (?<type>saving throw|check)/i;
    const saveSearchMatch = text.match(saveSearch);
    const saveSearchNew = /(?<ability>\w+) (?<type>saving throw|check): DC (?<dc>\d+)/i;
    const saveSearchNewMatch = text.match(saveSearchNew);

    const savingThrow = saveSearchMatch ?? saveSearchNewMatch;
    const halfSaveSearch = /or half as much damage on a successful one|Success: Half damage/i;
    const halfMatch = halfSaveSearch.test(text);
    if (halfMatch) save.half = true;

    if (savingThrow?.groups) {
      save.dc.formula = savingThrow.groups.dc;
      save.dc.calculation = "";
      save.ability = [savingThrow.groups.ability.toLowerCase().substring(0, 3)];
    } else if (spellSave?.groups) {
      // save.dc = 10;
      save.ability = [spellSave.groups.ability.toLowerCase().substring(0, 3)];
      save.dc.calculation = "spellcasting";
    } else if (summonSave?.groups) {
      save.ability = [summonSave.groups.ability.toLowerCase().substring(0, 3)];
      save.dc.calculation = "spellcasting";
    }

    const healingRegex = /(regains|regain)\s+?(?:([0-9]+))?(?: *\(?([0-9]*d[0-9]+(?:\s*[-+]\s*[0-9]+)??)\)?)?\s+hit\s+points/i;
    const healingMatch = healingRegex.test(text);

    const result: IFeatureBasicsResult = {
      matches: {
        attackMatches: standardAttackMatches,
        summonAttackMatches,
        healingMatch,
        spellSave,
        saveSearchMatch,
        saveSearchNewMatch,
        halfMatch,
      },
      save,
      midiProperties: isAttack
        ? { otherSaveDamage: "halfdam" }
        : { saveDamage: "halfdam" },
      properties: {
        isAttack,
        isSummonAttack,
        spellSaveRegExpMatchArray: spellSave,
        isSpellSave: Boolean(spellSave),
        savingThrowRegExpMatchArray: savingThrow,
        isSavingThrow: Boolean(savingThrow),
        summonSaveRegExpMatchArray: summonSave,
        isSummonSave: Boolean(summonSave),
        isSave: Boolean(spellSave || savingThrow || summonSave),
        halfDamage: halfMatch,
        pbToAttack,
        weaponAttack,
        spellAttack,
        meleeAttack,
        rangedAttack,
        healingAction: healingMatch,
        toHit,
        yourSpellAttackModToHit,
      },
    };

    return result;
  }

  static splitStringByComma(str: string): string[] {
    // Regular expression to match commas not inside brackets
    const regex = /,(?![^(]*\))/g;
    const result = str.split(regex);
    return result.map((item) => item.replaceAll("*", "").trim().replace(/\.$/, ""));
  }

  static parseOutMonsterSpells(text: string): IDDBParsedMonsterSpell[] {
    const results: IDDBParsedMonsterSpell[] = [];

    const processSpell = (spellName: string) => {
      const extraCheckRegex = /(.*)\((.*)\)/i;
      const extraMatch = extraCheckRegex.exec(spellName.trim());

      let level = null;
      let targetSelf = null;
      let duration = null;
      const extras = [];

      if (extraMatch) {
        for (const extra of extraMatch[2].split(",")) {
          const levelRegex = /level (\d) version/i;
          const levelMatch = levelRegex.exec(extra);
          if (levelMatch) level = levelMatch[1];
          const targetSelfRegex = /(self only|on itself)/i;
          const targetSelfMatch = targetSelfRegex.exec(extra);
          if (targetSelfMatch) targetSelf = true;
          const durationRegex = /(\d+)-(\w+) duration/i;
          const durationMatch = durationRegex.exec(extra);
          if (durationMatch) {
            duration = {
              override: true,
              value: durationMatch[1],
              units: durationMatch[2],
            };
          }
          if (!levelMatch) {
            extras.push(extra.trim());
          }
        }
      }
      return {
        name: extraMatch ? extraMatch[1].trim() : spellName.trim(),
        level,
        extra: extras.length > 0 ? extras.join(", ") : null,
        targetSelf,
        duration,
      };
    };

    // 3/day each: charm person (level 5 version), color spray, detect thoughts, hold person (level 3 version)
    const innateSearch = /^(\d+)\/(\w+)(?:\s+each)?:\s+(.*$)/i;
    const innateMatch = text.match(innateSearch);

    // console.warn(innateMatch);
    if (innateMatch) {
      DDBDescriptions.splitStringByComma(innateMatch[3]).forEach((spell: string) => {
        const data = processSpell(spell);
        results.push(foundry.utils.mergeObject(data, {
          period: innateMatch[2],
          quantity: innateMatch[1],
        }));
      });
    }

    // At will: dancing lights
    const atWillSearch = /^at will:\s+(.*$)/i;
    const atWillMatch = text.match(atWillSearch);
    // console.warn(atWillMatch);
    if (atWillMatch) {
      DDBDescriptions.splitStringByComma(atWillMatch[1]).forEach((spell: string) => {
        results.push(processSpell(spell));
      });
    }

    return results;
  };

}
