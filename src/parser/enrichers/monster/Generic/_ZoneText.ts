
import DDBDescriptions from "../../../lib/DDBDescriptions";

/**
 * Readers for rules text that describes an area on the map: its shape, whether it is difficult
 * terrain, and what it does to a creature that enters it or starts or ends its turn there. They
 * serve the lair options and the monster actions that place a zone, which word these the same way.
 */

/** What an area does to a creature that enters it or starts or ends its turn there. */
interface IZoneTrigger {
  events: string[];
  save: { ability: string[]; dc: string } | null;
  damageParts: I5eDamagePart[];
  onSave: "none" | "half";
  /** A dnd5e status the area inflicts, capitalised as effect hints expect it. */
  status: string | null;
  expiry: T5eEffectExpiry | null;
  excludeSelf: boolean;
}

interface IZoneTemplate {
  type: TTemplate;
  size: string;
  width?: string;
  height?: string;
  stationary?: boolean;
}

export const TERRAIN_WORDS: [RegExp, string][] = [
  [/\b(?:roots?|vines?|plants?|undergrowth|foliage|thicket|grass)/i, "plants"],
  [/\b(?:snow|blizzard)/i, "snow"],
  [/\b(?:ice|icy|hail|frost|frozen)/i, "ice"],
  [/\b(?:sand|dust|quicksand)/i, "sand"],
  // "bog", but not the boggle whose oil is no kind of mud
  [/\b(?:mud|swamp|bog(?!gle)|mire)/i, "mud"],
  [/\b(?:water|flood|tide|wave)/i, "liquid"],
  [/\b(?:web|webbing)/i, "web"],
  [/\b(?:rubble|rocks?|stones?|spikes?|crystal)/i, "rocks"],
];

export const STATUSES = ["blinded", "charmed", "deafened", "frightened", "grappled", "incapacitated", "paralyzed",
  "petrified", "poisoned", "prone", "restrained", "stunned"];

export function stripBlock(html: string): string {
  return html
    // a soft hyphen sits inside "10-foot" in places, and would otherwise become a space
    .replace(/&shy;|\u00AD/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;|’/g, "'")
    .replace(/&mdash;|&ndash;/g, "-")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The dnd5e terrain type the text points at, at most one. */
export function terrainTypes(text: string): string[] {
  return TERRAIN_WORDS.filter(([word]) => word.test(text)).map(([, type]) => type).slice(0, 1);
}

/** The area the text describes, or null when it gives the area no shape. */
export function parseShape(text: string): { template: IZoneTemplate; centred: boolean } | null {
  const wall = (/up to (\d+) feet long, (\d+) feet high, and (\d+) f(?:ee|oo)t thick/i).exec(text);
  if (wall) return { template: { type: "wall", size: wall[1], height: wall[2], width: wall[3] }, centred: false };

  const cylinder = (/cylinder[^.]*?(\d+)[- ]foot[- ]radius|(\d+)[- ]foot[- ]radius[^.]*?cylinder/i).exec(text);
  if (cylinder) {
    const height = (/(\d+) feet (?:tall|high)|(\d+)[- ]foot[- ](?:tall|high)/i).exec(text);
    return {
      template: { type: "cylinder", size: cylinder[1] ?? cylinder[2], ...(height ? { height: height[1] ?? height[2] } : {}) },
      centred: false,
    };
  }

  const sphere = (/(\d+)[- ]foot[- ]radius sphere/i).exec(text);
  if (sphere) return { template: { type: "sphere", size: sphere[1] }, centred: false };

  // "a 100-foot diameter circle centered on the dragon" originates from the monster
  const diameter = (/(\d+)[- ]foot[- ]diameter circle/i).exec(text);
  if (diameter) {
    return { template: { type: "radius", size: `${Number(diameter[1]) / 2}`, stationary: true }, centred: true };
  }

  const radius = (/(\d+)[- ]foot[- ]radius/i).exec(text);
  if (radius) return { template: { type: "circle", size: radius[1] }, centred: false };

  const block = (/(\d+)[- ]foot(?:[- ]wide)?[- ](square|cube)/i).exec(text);
  if (block) return { template: { type: block[2].toLowerCase() as TTemplate, size: block[1] }, centred: false };

  const aroundPoint = (/area within (\d+) feet of that point/i).exec(text);
  if (aroundPoint) return { template: { type: "circle", size: aroundPoint[1] }, centred: false };

  // "the air within 60 feet of the vessel": an area around something that is not the monster
  const aroundObject = (/\b(?:air|area|ground) within (\d+) feet of the (?:vessel|ship)/i).exec(text);
  if (aroundObject) return { template: { type: "circle", size: aroundObject[1] }, centred: true };

  return null;
}

/**
 * What the area does after it appears, or null when the text only acts once. The save and
 * damage are read from the trigger's own sentence onwards; one that says a creature "must
 * also make this saving throw" there restates nothing, so it falls back to the text's save.
 */
export function parseTrigger(text: string): IZoneTrigger | null {
  const events: string[] = [];
  const enter = (/\b(?:enters?|moves? into|flies into|move through)\b/i).exec(text);
  const start = (/\bstarts? (?:its|their|his|her) turn\b/i).exec(text);
  const end = (/\bends? (?:its|their|his|her) turn\b/i).exec(text);
  if (enter) events.push("tokenEnter");
  if (start) events.push("tokenTurnStart");
  if (end) events.push("tokenTurnEnd");
  if (events.length === 0) return null;

  const first = Math.min(...[enter, start, end].filter((match) => match !== null).map((match) => match.index));
  const sentenceStart = Math.max(text.lastIndexOf(". ", first) + 2, 0);
  const tail = text.slice(sentenceStart);

  // "A creature must also make this saving throw when it enters..." restates nothing, so the
  // text's own save and damage apply. Any other trigger sentence stands alone: an area that
  // just "takes 3d6 damage" on a later turn has no save, whatever was rolled as it appeared.
  const restated = (/\b(?:this|that|the same|the) sav(?:e|ing throw)\b/i).test(tail);
  const own = DDBDescriptions.parseSaves(tail);
  const parsed = own[0] ?? (restated ? DDBDescriptions.parseSaves(text).at(-1) : null) ?? null;
  const save = parsed?.dc.formula ? { ability: parsed.ability, dc: parsed.dc.formula } : null;
  const scope = own.length === 0 && restated ? text : tail;
  const { parts } = DDBDescriptions.parseDamageParts(scope);
  // "1d8 piercing damage for every 5 feet it moves" is a cost of moving, not of being there
  const damageParts = (/for every \d+ feet/i).test(scope) ? [] : parts;
  // the first condition named is the one the trigger inflicts; later ones qualify it
  // ("poisoned... While poisoned in this way, a creature is incapacitated")
  const status = STATUSES
    .map((name) => ({ name, index: scope.search(new RegExp(`\\b${name}\\b`, "i")) }))
    .filter((found) => found.index >= 0)
    .sort((a, b) => a.index - b.index)[0]?.name ?? null;
  if (!save && damageParts.length === 0 && !status) return null;

  return {
    events,
    save,
    damageParts,
    onSave: DDBDescriptions.halfOnSave(scope) ? "half" : "none",
    status: status ? status.charAt(0).toUpperCase() + status.slice(1) : null,
    expiry: DDBDescriptions.nextTurnExpiry(scope)?.expiry ?? null,
    excludeSelf: (/\bother than (?:the|it|him|her)\b|\bis unaffected\b|\bexcept\b/i).test(text),
  };
}

export function parseDuration(text: string): I5eActivityDuration {
  if ((/until (?:the end of )?initiative count 20 on the next round/i).test(text)) return { value: "1", units: "round" };
  const timed = (/(?:remains|lasts|persists) for (\d+) (minute|hour)s?/i).exec(text);
  if (timed) return { value: timed[1], units: timed[2].toLowerCase() === "hour" ? "hour" : "minute" };
  return { units: "spec", special: "Until this lair action is used again or the creature dies" };
}
