/**
 * Readers for monster text that calls other creatures onto the map. Shared by the generic summon
 * enricher and the lair reader, and free of imports so both can use it from anywhere.
 *
 * D&D Beyond leaves the residue of its monster tag on most creature names, as
 * "singular;plural" ("1d4 giant rat;giant rats"). Where it is present the name is certain; where
 * it is not ("summons an earth elemental") the name is whatever follows the count, which is only
 * trusted because the features that reach this are picked by name.
 *
 * That residue is what a bulk munch receives. A monster fetched by id arrives with the tag intact
 * instead, as a link carrying the creature's D&D Beyond id; `monsterLinksToResidue` rewrites those
 * links into the residue form so one reader serves both, and hands back the ids.
 */

// the lookbehind keeps the match off the link's own data-tooltip-href, which ends in "-tooltip"
const MONSTER_LINK = /<a\s[^>]*?(?<![-\w])href="[^"]*?\/monsters\/(\d+)-([a-z0-9-]+)"[^>]*>([^<]*)<\/a>/gi;

/**
 * Rewrites `<a href="/monsters/17028-swarm-of-bats">swarms of bats</a>` as
 * "swarm of bats;swarms of bats", and collects each creature's id under its lower-case name.
 */
export function monsterLinksToResidue(html: string): { html: string; ids: Map<string, number> } {
  const ids = new Map<string, number>();
  const rewritten = `${html ?? ""}`.replace(MONSTER_LINK, (_whole, id: string, slug: string, label: string) => {
    const name = slug.replace(/-s-/g, "'s ").replace(/-s$/, "'s").replace(/-/g, " ").trim();
    ids.set(name.toLowerCase(), Number(id));
    return `${name};${label.trim() || name}`;
  });
  return { html: rewritten, ids };
}

const NUMBER_WORDS: Record<string, string> = {
  a: "1", an: "1", one: "1", two: "2", three: "3", four: "4", five: "5",
  six: "6", seven: "7", eight: "8", nine: "9", ten: "10", twelve: "12",
};

const COUNT = "\\d+d\\d+(?: ?[+] ?\\d+)?|\\d+|an?|one|two|three|four|five|six|seven|eight|nine|ten|twelve";

// what the monster does to bring them: "summons", "magically calls", "animates", "disgorges",
// "causes ... to appear", "chance of summoning", "shouts for aid and"
const VERB = "summon(?:s|ing)?|calls?(?: forth| up(?! to))?|animates?|disgorges?|conjures?|releases?|caus(?:es?|ing)|shouts? for aid and";

// a creature name runs until the list moves on or the sentence turns to something else
const NAME_END = "(?=,|;\\s| or | and |\\.|\\s\\(|:| that | who | whom | which | in | into | to | with | made | bound | within | from | appears?\\b| arrives?\\b| under |$)";

// "2d4 swarm of bats;swarms of bats or swarm of rats;rats": a creature with no count of its own is
// only read straight after a list separator, and only when it carries the tag residue
const ITEM = new RegExp(
  `(?:(?:\\b(up to) )?\\b(${COUNT}) |(?<=, or |, | or | as )(?!(?:or|and|he|she|it|they) ))((?:[A-Za-z][\\w'-]*)(?: [\\w'-]+){0,5}?(?: \\([^)]{1,40}\\))? ?(?:;[\\w'][\\w' -]*?)?)${NAME_END}`,
  "gi",
);

const CR_ITEM = new RegExp(
  `\\b(${COUNT}) ([a-z]+?)s? (?:with|that has|of) (?:a )?challenge rating (?:of )?(\\d+(?:/\\d+)?) or lower`,
  "i",
);

// creature words a challenge-rating summon can name, as dnd5e creature types
const CR_TYPES: Record<string, TCreatureTypes> = {
  demon: "fiend", devil: "fiend", fiend: "fiend", yugoloth: "fiend", plant: "plant", beast: "beast",
  elemental: "elemental", undead: "undead", fey: "fey", celestial: "celestial", aberration: "aberration",
  construct: "construct", dragon: "dragon", monstrosity: "monstrosity", ooze: "ooze", giant: "giant",
};

// words that follow a count without being a creature: "one of the following", "1 minute", "a
// Short or Long Rest" from the feature's own title, "an unoccupied space"
const NOT_A_CREATURE = /^(?:of\b|minute|hour|round|day|turn|action|bonus|creature|target|point|space|time|use|feet|foot|mile|percent|additional|other|more|or\b|size|type|kind|short\b|long\b|magical\b|unoccupied|summoned|called|dead\b|corpse|ally\b|mount\b|number|total|result|d\d)/i;

// a noun after one of these belongs to the sentence, not to the list: "the spirit of a Thayan
// assassin", "by an infernal contract", "in an unoccupied space"
const AFTER_PREPOSITION = /\b(?:of|by|to|on|with|from|in|at|for|as) $/i;

function toCount(raw: string): string {
  const lower = raw.toLowerCase();
  return NUMBER_WORDS[lower] ?? lower.replace(/\s*\+\s*/, " + ");
}

function titleCase(name: string): string {
  return name.replace(/\b([a-z])([\w']*)/g, (whole, first: string, rest: string) => {
    return ["of", "the", "and", "in"].includes(whole) ? whole : `${first.toUpperCase()}${rest}`;
  }).replace(/^./, (first) => first.toUpperCase());
}

function singular(name: string): string {
  if ((/wolves$/i).test(name)) return name.replace(/ves$/i, "f");
  return (/[^s]s$/i).test(name) ? name.slice(0, -1) : name;
}

/**
 * "swarm of rats;rats" names the singular, and "specter (MCDM);specter" keeps the book suffix the
 * compendium uses. "zombie (see the Monster Manual )" marks a stat block as surely as the residue
 * does, and "hunting hounds (use the Wolf stat block)" names the block to use.
 */
function creatureName(raw: string): { name: string; tagged: boolean } {
  const useBlock = (/\(use the ([\w' -]+?) stat ?block/i).exec(raw);
  if (useBlock) return { name: titleCase(useBlock[1].trim()), tagged: true };
  const seeBook = (/\((?:see|both|all)\b/i).test(raw);
  const tagged = raw.includes(";") || seeBook;
  const singular = raw.split(";")[0]
    .replace(/\s*\((?:see|both|all|lacks?|use)\b[^)]*\)?/i, "")
    .replace(/^(?:normal|ordinary) /i, "")
    .replace(/\s+/g, " ")
    .trim();
  return { name: titleCase(singular), tagged };
}

/** Feet to where the creatures appear: "within 60 feet of it", "within 30 feet of the necromancer". */
export function parseSummonRange(text: string): string | null {
  const appear = (/(?:appears?|arrives?|spaces?|summons?)[^.]{0,120}?within (\d+) feet/i).exec(text);
  return appear?.[1] ?? (/within (\d+) feet/i).exec(text)?.[1] ?? null;
}

/** How long they stay: "remain for 1 hour", "Each lasts for 1 hour", "vanishes after 1 minute". */
export function parseSummonDuration(text: string): { value: string; units: TDurationUnit } | null {
  const match = (/(?:remains?|lasts?|vanish(?:es)?|disappears?|dissipates?|persists?)[^.]{0,40}?(?:for|after) (\d+|an?|one) (round|minute|hour|day)s?/i).exec(text);
  if (!match) return null;
  return { value: NUMBER_WORDS[match[1].toLowerCase()] ?? match[1], units: match[2].toLowerCase() as TDurationUnit };
}

/**
 * The creatures a feature calls, with how many, how far away, for how long, and the chance of it
 * working when the text gives one. Null when the text names none.
 *
 * `selfName` is the summoner's own name, for "1d4 mephits of its kind".
 */
export function parseSummon(source: string, selfName = "") {
  const text = `${source ?? ""}`
    .replace(/\u00AD/g, "")
    .replace(/\u2019/g, "'")
    // the monster parser's text runs paragraphs together with nothing between them
    .replace(/([a-z)])([.:])(?=[A-Z])/g, "$1$2 ")
    .replace(/\s+/g, " ");
  const sentences = text.split(/(?<=[.:]) /);
  const verb = new RegExp(`\\b(?:${VERB})\\b`, "i");

  const creatures: { name: string; count: string; upTo: boolean; certain?: boolean }[] = [];
  let challenge: { count: string; cr: string; types: TCreatureTypes[] } | null = null;
  let tagged = false;

  const appearing = /\bappears? in (?:an? |the )?(?:nearest )?unoccupied|\bappear in unoccupied|\barrives?\b/i;

  let foundAt = -1;
  for (const [index, sentence] of sentences.entries()) {
    // "Up to five skeletons or zombies appear in unoccupied spaces" has no verb of calling
    const called = verb.exec(sentence);
    // once something is called, only another calling sentence adds to it ("can call 3d6 wolves instead")
    if (!called && (creatures.some((creature) => creature.certain) || !appearing.test(sentence))) continue;
    const clause = (called ? sentence.slice(called.index + called[0].length) : sentence)
      .replace(/\bits choice of /i, "");

    const kind = (new RegExp(`\\b(${COUNT}) [\\w' -]{2,40}? of its kind`, "i")).exec(clause);
    if (kind && selfName) {
      creatures.push({ name: selfName.replace(/\s*\([^)]*\)\s*$/, "").trim(), count: toCount(kind[1]), upTo: false, certain: true });
      tagged = true;
      break;
    }

    const byRating = CR_ITEM.exec(clause);
    if (byRating && !challenge) {
      const type = CR_TYPES[byRating[2].toLowerCase()];
      challenge = { count: toCount(byRating[1]), cr: byRating[3], types: type ? [type] : [] };
    }

    let lastCount: string | null = null;
    let lastUpTo = false;
    const listStart = creatures.length;
    for (const match of clause.matchAll(ITEM)) {
      const raw = match[3].trim();
      const before = clause.slice(0, match.index ?? 0);
      if (!match[2] && !raw.includes(";")) continue;
      if (NOT_A_CREATURE.test(raw) || (/challenge rating/i).test(raw)) {
        // "up to six corpses ... rise as skeletons, zombies, or ghouls": the count is the corpses'
        if (match[2]) {
          lastCount = toCount(match[2]);
          lastUpTo = Boolean(match[1]);
        }
        continue;
      }
      if (match[2] && !match[1] && AFTER_PREPOSITION.test(before)) continue;
      if (byRating && raw.toLowerCase().startsWith(byRating[2].toLowerCase())) continue;
      const parsed = creatureName(raw);
      // "one jewel-encrusted, fiendish animated armor": a lone compound word before a comma is the
      // first of a run of adjectives, not a name
      const after = clause.slice((match.index ?? 0) + match[0].length);
      if (!parsed.tagged && (/^[\w']+-[\w'-]+$/).test(raw) && after.startsWith(", ")) continue;
      if (!parsed.name || creatures.some((creature) => creature.name === parsed.name)) continue;
      // an "or" between two creatures shares the count in front of the first
      const count = match[2] ? toCount(match[2]) : lastCount ?? "1";
      const upTo = match[2] ? Boolean(match[1]) : lastUpTo;
      lastCount = count;
      lastUpTo = upTo;
      tagged = tagged || parsed.tagged;
      // the residue gives the singular; a bare plural after a count of several has to be cut back
      const name = !parsed.tagged && count !== "1" ? singular(parsed.name) : parsed.name;
      creatures.push({ name, count, upTo, certain: parsed.tagged || !(/^an?$/i).test(match[2] ?? "") });
      if (foundAt < 0) foundAt = index;
    }
    // "(both appear in the Monster Manual )" after the last name vouches for the whole list
    if ((/\((?:both|all) appear/i).test(clause)) {
      for (const creature of creatures.slice(listStart)) creature.certain = true;
    }
  }

  // beside creatures the text marks as stat blocks, "a high-frequency cry" is just a noun
  if (creatures.some((creature) => creature.certain)) {
    for (let i = creatures.length - 1; i >= 0; i--) if (!creatures[i].certain) creatures.splice(i, 1);
  }

  // "2d4 giant bees (use the statistics of a giant wasp)", "the mount uses the stat block of an elk"
  const standIn = (/uses? the (?:statistics|stat block) of an? ([\w' -]+?)(?=[).,]| \(| with | except)|use the ([\w' -]+?) stat ?block/i).exec(text);
  const several = (/\bone or two\b/i).test(text);

  if (creatures.length === 0 && !challenge && sentences.some((sentence) => verb.test(sentence) || appearing.test(sentence))) {
    // what arrives is named by what it becomes: "appears as a wraith (see the Monster Manual )",
    // "become awakened tree;awakened trees", "rises as a zombie (MCDM);zombie"
    const becomes = (/\b(?:appears?|rises?|becomes?) (?:as )?(?:an? )?((?:[a-z][\w'-]*)(?: [\w'-]+){0,3}?(?: \([^)]{1,40}\))? ?(?:;[\w' -]+?)?)(?=,|\.| \(| in | for | under |$)/i).exec(text);
    const named = becomes ? creatureName(becomes[1].trim()) : null;
    if (named?.tagged || (named && (/\(see\b/i).test(text.slice(becomes?.index ?? 0, (becomes?.index ?? 0) + becomes![0].length + 8)))) {
      creatures.push({ name: named.name, count: several ? "2" : "1", upTo: several });
      tagged = true;
    } else if (standIn) {
      creatures.push({ name: titleCase((standIn[1] ?? standIn[2]).trim()), count: several ? "2" : "1", upTo: several });
      tagged = true;
    }
  }

  if (creatures.length === 0 && !challenge) return null;

  if (standIn && creatures.length === 1) {
    creatures[0].name = titleCase((standIn[1] ?? standIn[2]).trim());
    tagged = true;
  }

  // without the tag residue, the text has to say the creatures turn up somewhere
  const arrives = (/\bappears?\b|\barrives?\b|unoccupied space|\bsummoned (?:creature|\w+)|\bcalled (?:creature|\w+)/i).test(text);
  if (!tagged && !challenge && !arrives) return null;

  // the chance of the summoning itself, not of something the summoned creature later does
  const chance = (/(\d+) percent chance (?:of (?:magically )?(?:summoning|calling|success)|that (?:\d|an?\b|one\b))/i).exec(text)?.[1] ?? null;
  const delay = (/arrives? in (\d+d\d+|\d+) rounds?/i).exec(text)?.[1] ?? null;

  return {
    creatures,
    // true when a name carries the tag residue or names its stat block, false when every name
    // is only what followed a count
    tagged,
    challenge: creatures.length === 0 ? challenge : null,
    // a feature with several options has several ranges; the one that counts is said with the creatures
    range: parseSummonRange(sentences.slice(Math.max(foundAt, 0), Math.max(foundAt, 0) + 2).join(" ")) ?? parseSummonRange(text),
    duration: parseSummonDuration(text),
    chance,
    delay,
  };
}
