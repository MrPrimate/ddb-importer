/**
 * Readers for monster rules text that grants damage resistance or immunity for a while: to the
 * monster itself ("Until it takes its Emerge action, it has resistance to all damage, and it is
 * restrained"), to other creatures ("The creature gains Resistance to the triggering damage"), or
 * only in one form or state ("Ghostly Body (Ghostwalk Form Only)"). They serve SelfResistance,
 * GrantResistance, FormResistance and the Shape-Shift form effects.
 */

export const DAMAGE_TYPES = [
  "acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison",
  "psychic", "radiant", "slashing", "thunder",
];

const PHYSICAL_TYPES = ["bludgeoning", "piercing", "slashing"];

const STATUSES = [
  "blinded", "charmed", "deafened", "frightened", "grappled", "incapacitated", "invisible", "paralyzed",
  "petrified", "poisoned", "prone", "restrained", "stunned",
];

/** A resistance or immunity read from one sentence. */
interface IResistanceGrant {
  trait: "dr" | "di";
  /** The granted types, or the options to pick one from when `choice` is set. */
  types: string[];
  /** One of `types` is picked when the feature is used ("one damage type of his choice", "the triggering damage"). */
  choice: boolean;
  /** "from nonmagical attacks" / "from mundane attacks": magical physical damage bypasses it */
  nonmagical: boolean;
  /** dnd5e statuses the same sentence puts on the creature, capitalised as effect hints expect them. */
  statuses: string[];
  sentence: string;
}

/** How long a granted benefit lasts. */
interface IResistanceDuration {
  seconds: number | null;
  expiry: T5eEffectExpiry | null;
  concentration: boolean;
}

interface IResistanceChangeHelper {
  damageResistanceChange: (type: string, priority?: number) => IActiveEffectChangeData;
  damageImmunityChange: (type: string, priority?: number) => IActiveEffectChangeData;
  conditionImmunityChange: (condition: string, priority?: number) => IActiveEffectChangeData;
  addChange: (value: string, priority: number, key: string) => IActiveEffectChangeData;
}

const TYPE = `(?:${DAMAGE_TYPES.join("|")})`;
const LIST = `${TYPE}(?:,? (?:and |or )?${TYPE})*`;

const GRANT = new RegExp(
  `\\b(?<kind>resistance|immunity) to (?:`
  + `(?<what>all damage|${LIST} damage(?:,? and to ${LIST} damage)?)(?<bypass> from (?:nonmagical|mundane) attacks)?`
  + `|(?<picked>one damage type|one type of damage|a type of damage|that damage type|the type of damage|the triggering damage|that instance of damage|the damage that triggered|damage of the type)`
  + `)`,
  "i",
);

// the grant belongs to someone else when its clause names another creature
const OTHER_SUBJECT = /\b(?:targets?|ally|allies|creatures?|each|another|chosen|guard)\b/i;

const STATUS_PATTERN = new RegExp(
  `\\b(?:is|are|becomes?) (${STATUSES.join("|")})\\b|\\bhas the (${STATUSES.join("|")}) condition`,
  "gi",
);

/** Split collapsed stat-block text into sentences; list items can run on without a full stop. */
function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/);
}

function typesIn(text: string): string[] {
  return DAMAGE_TYPES.filter((type) => new RegExp(`\\b${type}\\b`, "i").test(text));
}

function capitalise(word: string): string {
  return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
}

/**
 * Read one sentence's grants, in order. `self` rejects a grant whose clause names another
 * creature; `other` takes any grant, as the feature is only routed there when it buffs someone else.
 */
function readGrants(sentence: string, text: string, subject: "self" | "other"): IResistanceGrant[] {
  const grants: IResistanceGrant[] = [];
  const statuses = [...new Set([...sentence.matchAll(STATUS_PATTERN)].map((m) => capitalise(m[1] ?? m[2])))];

  for (const match of sentence.matchAll(new RegExp(GRANT.source, "gi"))) {
    if (!match.groups) continue;

    if (subject === "self") {
      // the clause that owns the grant; list items run on without a full stop ("... (included in
      // attacks) He has resistance ..."), so a capitalised pronoun also starts a clause
      const lead = sentence.slice(0, match.index).split(/[,;)]|(?=\b(?:He|She|It|They)\b)/).pop() ?? "";
      if (OTHER_SUBJECT.test(lead)) continue;
    }

    let types: string[];
    let choice: boolean;
    if (match.groups.picked) {
      // the options follow in the sentence ("one damage type of his choice - acid, cold, ..."), sit
      // in a list elsewhere in the feature ("chooses one of the following damage types: ..."), are
      // a weapon's, or are open. Damage the feature deals or takes ("the witchwoven takes 10
      // (3d6) Force damage") is not an option.
      const after = sentence.slice(match.index)
        .replace(new RegExp(`\\b(?:takes?|taking|deals?|dealing)\\b[^.;]*?\\b${TYPE} damage`, "gi"), "");
      const optionList = text.match(/damage types?:([^.]+)/i)?.[1] ?? "";
      const listed = typesIn(after).length > 0 ? typesIn(after) : typesIn(optionList);
      types = listed.length > 0
        ? listed
        : (/\bweapon\b/i).test(sentence) ? [...PHYSICAL_TYPES] : [...DAMAGE_TYPES];
      choice = true;
    } else {
      const what = match.groups.what.toLowerCase();
      types = what.startsWith("all") ? [...DAMAGE_TYPES] : typesIn(what);
      // "acid, cold, fire, lightning, or thunder damage" is a choice of one
      choice = (/\bor\b/).test(what);
    }
    // a choice of one is a fixed trait of that stat block (Ashwalker (Fire)), already in its damage adjustments
    if (types.length === 0 || (choice && types.length < 2)) continue;

    grants.push({
      trait: match.groups.kind.toLowerCase() === "immunity" ? "di" : "dr",
      types,
      choice,
      nonmagical: Boolean(match.groups.bypass),
      statuses,
      sentence: sentence.trim(),
    });
  }
  return grants;
}

/** Read the first grant in which the monster itself gains damage resistance or immunity. */
export function parseSelfResistance(text: string): IResistanceGrant | null {
  return sentences(text).flatMap((sentence) => readGrants(sentence, text, "self"))[0] ?? null;
}

/** Read the first grant of resistance or immunity, whoever receives it. */
export function parseGrantedResistance(text: string): IResistanceGrant | null {
  return sentences(text).flatMap((sentence) => readGrants(sentence, text, "other"))[0] ?? null;
}

/** Every fixed (not chosen) self grant in the text, for traits that list several ("Ghostly Body"). */
export function parseAllSelfResistances(text: string): IResistanceGrant[] {
  return sentences(text)
    .flatMap((sentence) => readGrants(sentence, text, "self"))
    .filter((grant) => !grant.choice);
}

/** "immunity to the grappled, paralyzed, petrified, and restrained conditions" */
export function parseConditionImmunities(text: string): string[] {
  const match = text.match(/immunity to the ((?:\w+,? (?:and |or )?)+)conditions?/i);
  if (!match) return [];
  return STATUSES.filter((status) => new RegExp(`\\b${status}\\b`, "i").test(match[1]));
}

/** "advantage on Strength checks and Strength saving throws", the rage wording. */
export function hasStrengthAdvantage(text: string): boolean {
  return (/advantage on Strength (?:ability )?checks and (?:Strength )?saving throws/i).test(text);
}

/**
 * The benefit's duration. A turn edge of the creature's own next turn becomes a target pseudo
 * expiry: dnd5e skips the turn the effect is applied on, so a bonus action used on the monster's
 * turn still lasts through its next one. "The attacker's turn" is the core turnEnd of whichever
 * combatant was acting when the reaction was taken.
 */
export function parseResistanceDuration(text: string): IResistanceDuration {
  const concentration = (/\bconcentrat/i).test(text);

  const nextTurn = text.match(/until the (start|end|beginning) of (?:its|his|her|their) next turn/i);
  if (nextTurn) {
    return { seconds: null, expiry: nextTurn[1].toLowerCase() === "end" ? "targetEnd" : "targetStart", concentration };
  }
  if ((/until the end of the attacker's turn/i).test(text)) {
    return { seconds: null, expiry: "turnEnd", concentration };
  }

  const counted = text.match(/\b(?:for|lasts(?: for)?) (\d+|a|an|one) (minute|hour)s?\b/i);
  if (counted) {
    const amount = Number(counted[1]) || 1;
    return { seconds: amount * (counted[2].toLowerCase() === "hour" ? 3600 : 60), expiry: null, concentration };
  }

  return { seconds: null, expiry: null, concentration };
}

/**
 * The effect changes for a grant. A choice grant takes the picked `types`, one effect per option.
 */
export function resistanceChanges(
  grant: IResistanceGrant,
  ChangeHelper: IResistanceChangeHelper,
  types: string[] = grant.types,
): IActiveEffectChangeData[] {
  const changes = types.map((type) => grant.trait === "di"
    ? ChangeHelper.damageImmunityChange(type)
    : ChangeHelper.damageResistanceChange(type));
  // dnd5e applies bypasses to physical damage only, so other resistances the monster has are untouched
  if (grant.nonmagical) changes.push(ChangeHelper.addChange("mgc", 20, `system.traits.${grant.trait}.bypasses`));
  return changes;
}

/** The effect-name label for one picked type: "Fire Resistance", "Cold Immunity". */
export function choiceLabel(grant: IResistanceGrant, type: string): string {
  return `${capitalise(type)} ${grant.trait === "di" ? "Immunity" : "Resistance"}`;
}
