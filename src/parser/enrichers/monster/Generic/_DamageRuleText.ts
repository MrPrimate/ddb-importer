import { stripBlock } from "./_ZoneText";

/** One "ignores resistance" clause read from monster text, as dnd5e 6.1 damage application rules. */
interface IDamageRuleClause {
  /** Damage types the clause names, or `["ALL"]` when it names none ("This attack ignores damage resistance"). */
  types: string[];
  rules: TDamageApplicationRule[];
  /**
   * `standing`: a trait covering everything the monster deals ("Fire damage dealt by the jurist
   * ignores damage resistance"). `self`: only the damage of the action carrying the text ("This
   * damage ignores Resistance and Immunity").
   */
  scope: "standing" | "self";
  /** "damage dealt by Krull's spells" */
  spellsOnly: boolean;
  /** "damage from her weapon attacks" */
  weaponAttacksOnly: boolean;
}

// a clause gated on the target ("attacks against floral dragons and plants"), or one about damage
// the monster itself takes ("it cannot reduce the swarm to 0 hit points"), has no rule form: dnd5e
// filters these rules against the attacker's roll only
const UNSUPPORTED = /\bagainst (?!damage\b)|\bif the target\b|\bcan(?:not|'t) reduce\b|\bdon't function\b|\bconditions?\b/i;

/**
 * Read every "ignores resistance" clause in monster feature text. `damageTypes` are the dnd5e damage
 * type keys to look for, lowercase.
 */
export function parseDamageRules(html: string, damageTypes: string[]): IDamageRuleClause[] {
  const text = stripBlock(html);
  const clauses: IDamageRuleClause[] = [];
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if (!(/\bignores?\b/i).test(sentence) || UNSUPPORTED.test(sentence)) continue;
    const ignoring = sentence.slice(sentence.search(/\bignores?\b/i));
    const rules: TDamageApplicationRule[] = [];
    if ((/\bresistances?\b/i).test(ignoring.split(/\btreats?\b/i)[0])) rules.push("resistance");
    if ((/\bimmunit(?:y|ies)\b/i).test(ignoring.split(/\btreats?\b/i)[0])) rules.push("immunity");
    if ((/\btreats? (?:damage )?immunity as (?:damage )?resistance\b/i).test(sentence)) rules.push("downgrade");
    if (rules.length === 0) continue;

    const types = damageTypes.filter((type) => new RegExp(`\\b${type}\\b`, "i").test(sentence));
    const standing = (/\bdamage (?:dealt by|from) (?!this\b)/i).test(sentence);
    clauses.push({
      types: types.length > 0 ? types : ["ALL"],
      rules,
      scope: standing ? "standing" : "self",
      spellsOnly: standing && (/'s spells\b/i).test(sentence),
      weaponAttacksOnly: standing && (/\bweapon attacks?\b/i).test(sentence),
    });
  }
  return clauses;
}
