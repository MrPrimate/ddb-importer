import ChangeHelper from "./ChangeHelper";

/**
 * DDB carries the "when" of a modifier in a free-text `restriction` string. The generator drops
 * every restricted modifier by default, because flattening "advantage on Con saves to maintain
 * concentration" onto every Con save is worse than nothing. dnd5e 6.0 rule conditions and its
 * native concentration field can express a few of those strings exactly, and this table is the
 * reviewed list of them: an entry maps a restriction to the filter clauses (or the native key)
 * that carry its meaning. Anything not matched here stays dropped, and a restriction that
 * really means "while feature X is active" must never be added (the feature's enricher owns
 * that through a toggled effect).
 *
 * The DDB strings are quoted verbatim in each entry so a payload change is easy to spot.
 */

export interface IRestrictionMatch {
  /** Table entry id, for tests and logs. */
  id: string;
  /** Extra filter clauses the rule change must carry. */
  conditions?: IEffectChangeFilter[];
  /** The modifier is about concentration saves: emit the native concentration field instead of a rule. */
  concentration?: boolean;
}

interface IRestrictionRule {
  id: string;
  pattern: RegExp;
  /** Verbatim DDB restriction strings seen in the audit fixtures. */
  seen: string[];
  resolve: (match: RegExpMatchArray) => IRestrictionMatch | null;
}

/** Class identifiers a "<Class> spell attacks" restriction may name; dnd5e keys spells by these. */
const SPELLCASTING_CLASSES = ["artificer", "bard", "cleric", "druid", "paladin", "ranger", "sorcerer", "warlock", "wizard"];

const RESTRICTION_RULES: IRestrictionRule[] = [
  {
    id: "concentration",
    pattern: /maintain(?:ing)?\s+(?:your\s+)?concentration/i,
    seen: [
      "to maintain Concentration.",
      "to maintain Concentration",
      "to maintain your concentration on a spell",
      "made to maintain your concentration on a spell when you take damage",
      "On saving throws made to maintain concentration on spells.",
    ],
    resolve: () => ({ id: "concentration", concentration: true }),
  },
  {
    id: "class-spell-attacks",
    pattern: /^advantage on (\w+) spell attacks$/i,
    seen: ["Advantage on Sorcerer Spell Attacks"],
    resolve: (match) => {
      const klass = match[1].toLowerCase();
      if (!SPELLCASTING_CLASSES.includes(klass)) return null;
      return { id: "class-spell-attacks", conditions: [ChangeHelper.classSpellFilter(klass)] };
    },
  },
];

/**
 * Filter clauses that scope an attack rule to what a DDB attack subtype names. `roll.attack.type`
 * is melee/ranged for the attack as rolled (a thrown melee weapon counts as ranged), and
 * `roll.attack.classification` separates weapon, spell and unarmed attacks.
 */
const ATTACK_SUBTYPE_CONDITIONS: Record<string, IEffectChangeFilter[]> = {
  "melee-attacks": [{ k: "roll.attack.type", o: "exact", v: "melee" }],
  "ranged-attacks": [{ k: "roll.attack.type", o: "exact", v: "ranged" }],
  "spell-attacks": [{ k: "roll.attack.classification", o: "exact", v: "spell" }],
  "weapon-attacks": [{ k: "roll.attack.classification", o: "exact", v: "weapon" }],
  "melee-weapon-attacks": [
    { k: "roll.attack.classification", o: "exact", v: "weapon" },
    { k: "roll.attack.type", o: "exact", v: "melee" },
  ],
  "ranged-weapon-attacks": [
    { k: "roll.attack.classification", o: "exact", v: "weapon" },
    { k: "roll.attack.type", o: "exact", v: "ranged" },
  ],
  "melee-spell-attacks": [
    { k: "roll.attack.classification", o: "exact", v: "spell" },
    { k: "roll.attack.type", o: "exact", v: "melee" },
  ],
  "ranged-spell-attacks": [
    { k: "roll.attack.classification", o: "exact", v: "spell" },
    { k: "roll.attack.type", o: "exact", v: "ranged" },
  ],
};

export default class RestrictionRules {

  static RULES = RESTRICTION_RULES;

  static ATTACK_SUBTYPE_CONDITIONS = ATTACK_SUBTYPE_CONDITIONS;

  /** Resolve a DDB restriction string; null when the table has nothing for it. */
  static match(restriction: string | null | undefined): IRestrictionMatch | null {
    const text = (restriction ?? "").trim();
    if (text === "") return null;
    for (const rule of RESTRICTION_RULES) {
      const match = text.match(rule.pattern);
      if (match) return rule.resolve(match);
    }
    return null;
  }

  /** True for a modifier whose restriction is about concentration saves. */
  static isConcentration(restriction: string | null | undefined): boolean {
    return RestrictionRules.match(restriction)?.concentration === true;
  }

  /** The filter clauses for an attack subtype, or null when the subtype is not an attack scope. */
  static attackConditions(subType: string | null | undefined): IEffectChangeFilter[] | null {
    if (!subType) return null;
    return ATTACK_SUBTYPE_CONDITIONS[subType] ?? null;
  }

}
