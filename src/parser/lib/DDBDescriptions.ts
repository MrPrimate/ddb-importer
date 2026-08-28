import logger from "../../lib/Logger";
import utils from "../../lib/Utils";
import { DICTIONARY } from "../../config/_module";
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
      });
    }

    return markers;
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

    const target = markers[targetIndex];
    const next = markers.slice(targetIndex + 1).find((marker) => marker.rank >= target.rank);
    let section = source.slice(target.end, next?.boundaryStart ?? source.length).trim();

    // Restore the partial block containing an inline heading so the result is
    // valid HTML; a list-item label is left for the balancer, which strips the
    // dangling </li>
    if (target.blockOpen && target.blockTag !== "li") {
      section = `${target.blockOpen}${section}`;
      const emptyBlock = new RegExp(`^<${target.blockTag}\\b[^>]*>\\s*</${target.blockTag}>\\s*`, "i");
      section = section.replace(emptyBlock, "");
    }

    section = DDBDescriptions.#balanceSectionFragment(section);

    return section ? { label: target.name, section } : null;
  }

  /** The rules text of {@link matchActivitySection}, for callers that do not need the label. */
  static extractActivitySection(source: string, activityName: string, { exactOnly = false } = {}): string | null {
    return DDBDescriptions.matchActivitySection(source, activityName, { exactOnly })?.section ?? null;
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

    const smallMatchRe = /until the (?<point>end|start) of (?<whos>its|the target's|your) next turn/ig;
    const smallMatch = smallMatchRe.exec(utils.nameString(text));
    if (smallMatch) {
      result.type = "special";
      result.units = "spec";
      result.seconds = 6;
      result.rounds = 1;
      result.special = smallMatch[0];
      // "turnStart" - expires at the start of the targets next turn
      // "turnEnd" - expires at the end of the targets next turn
      // "turnStartSource" - expires at the start of the source actors next turn
      // "turnEndSource" - expires at the end of the source actors next turn
      // "combatEnd" - expires at the end of combat
      // "joinCombat" - expires at the start of combat
      result.dae = [];
      const smallGroups = smallMatch.groups;
      if (smallGroups) {
        if (["its", "the target's"].includes(smallGroups.whos)) {
          result.dae.push(`turn${utils.capitalize(smallGroups.point)}`);
        } else if (["your"].includes(smallGroups.whos)) {
          result.dae.push(`turn${utils.capitalize(smallGroups.point)}Source`);
        }
      }

      return result;
    }
    return result;
  }

  static addSpecialDurationFlagsToEffect(effect: I5eEffectData, match: any) {
    const durations = [];
    // minutes
    if (match[7]
      && (match[7].includes("until the end of its next turn")
        || match[7].includes("until the end of the target's next turn"))
    ) {
      durations.push("turnEnd");
    } else if (match[7] && match[7].includes("until the start of the")) {
      durations.push("turnStartSource");
    }

    const currentSpecialDurations: TDAESpecialDuration[] = foundry.utils.getProperty(effect, "flags.dae.specialDuration") as TDAESpecialDuration[] ?? [];
    const specialDurations = utils.addArrayToProperties(currentSpecialDurations, durations ?? []);
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
