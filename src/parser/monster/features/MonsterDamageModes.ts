const STATUSES = "bloodied|grappled|prone|poisoned|frightened|restrained|stunned|paralyzed|incapacitated|unconscious|blinded|deafened|charmed|surprised";

/** The name of a mode whose condition no family names ("if Bjornhild uses Auril's Blessing"). */
const FALLBACK_MODE_NAME = "Conditional Attack";

/**
 * Conditions that a plain attack activity cannot stand in for: damage behind a saving throw ("If
 * the target is a creature, it must succeed on a DC 13 Strength saving throw or take an extra
 * ..."). Extra damage on a critical hit never reaches the fallback: it becomes the attack's
 * critical bonus, which dnd5e adds once, undoubled.
 */
const NO_FALLBACK_CONDITION = /saving throw|must succeed/i;

/** One conjunct of a condition that names a critical hit ("Arkhan rolls a 20 on the attack roll"). */
const CRITICAL_CONDITION = /\bcritical hit\b|\brolls? a (?:natural )?20\b/i;

/** A critical rider limited to creatures adds nothing a creature-only hit does not already say. */
const CREATURE_TARGET_CONDITION = /^the target is a creature$/i;

/**
 * Split a clause's condition into its critical hit part and the rest. 2024 stat blocks label the
 * clause instead ("Critical Hit: If the target is a shape-shifted creature, it takes an additional
 * ..."), so the label before the clause counts too.
 */
function splitCriticalCondition(before: string, condition: string): { critical: boolean; rest: string } {
  const conjuncts = condition.split(/\s+and\s+/i);
  const rest = conjuncts.filter((conjunct) => !CRITICAL_CONDITION.test(conjunct));
  return {
    critical: (/\bCritical Hit:/i).test(before) || rest.length < conjuncts.length,
    rest: rest.join(" and ").trim(),
  };
}

/**
 * The dice a critical alternative adds beyond dnd5e's doubling of the normal hit: "11 (1d8 + 7)
 * bludgeoning damage, or 20 (3d8 + 7) bludgeoning damage on a critical hit" doubles to 2d8 + 7, so
 * the critical bonus is 1d8. Empty when doubling already gives the alternative, null when the two
 * rolls do not share a die and flat bonus.
 */
function criticalAlternativeDice(normal: IMonsterDamageToken, alternative: IMonsterDamageToken): string | null {
  const roll = (token: IMonsterDamageToken) => (token.groups.dice ?? "").replace(/\s+/g, "").match(/^(\d+)d(\d+)([+-]\d+)?$/);
  const base = roll(normal);
  const critical = roll(alternative);
  if (!base || !critical || base[2] !== critical[2] || (base[3] ?? "") !== (critical[3] ?? "")) return null;
  const extra = Number(critical[1]) - (2 * Number(base[1]));
  if (extra < 0) return null;
  return extra === 0 ? "" : `${extra}d${critical[2]}`;
}

const DAMAGE_TYPE_CHOICE = /^\s*\((?:the |its |their )?[^()]*\bchoice\)/i;

/**
 * "10 (3d6) necrotic damage or (3d6) radiant damage (the son's choice)" is one roll of either
 * type, not an alternative: the "or" roll repeats the dice before it and names the choice. A
 * different roll before the choice ("or 18 (4d8) bludgeoning ... damage (the swarm's choice) if
 * the swarm has half of its hit points") is an alternative of its own.
 */
export function isDamageTypeChoice(text: string, token: IMonsterDamageToken, previousDice: string | undefined): boolean {
  if (token.groups.prefix.trim().toLowerCase() !== "or") return false;
  if (!DAMAGE_TYPE_CHOICE.test(text.slice(token.index + token[0].length))) return false;
  const dice = (token.groups.dice ?? token.groups.diceminor ?? "").replace(/\s+/g, "");
  return dice !== "" && (previousDice ?? "").replace(/\s+/g, "").startsWith(dice);
}

/**
 * Text before a damage roll that puts it in a saving throw's or a later turn's damage rather than
 * the hit ("On a failed save", "at the start of each of its turns", 2024's "Failure:"). Damage
 * after it is never a conditional variant of the hit.
 */
export const SAVE_OR_RECURRING_DAMAGE_CONTEXT = /saving throw|\bat (?:the |each )?(?:start|end) of (?:each|its|the|their)|\b(?:Failure|Success):/i;

/** Conditions applied after damage are distinct from statuses tested for extra damage. */
export function monsterDamageAppliedStatuses(text: string): Set<string> {
  return new Set([...text.matchAll(new RegExp(
    `\\b(?:has|have|gains?|knocked)\\s+(?:the\\s+)?(${STATUSES})\\b`, "gi",
  ))].map((match) => match[1].toLowerCase()));
}

/** Canonical names do not depend on the wording or capitalization of a particular printing. */
export function monsterDamageModeName(condition: string): string | null {
  const name = damageConditionFamilyName(condition);
  if (!name) return null;
  // These alternatives describe one family; other disjunctions need a neutral label.
  const alternatives = condition
    .replace(/\bor (?:fewer|less|lower|smaller|larger|bigger)\b/gi, "")
    .replace(/\bfiend or (?:an? )?undead\b/gi, "")
    .replace(/\b(?:ground or floor|holding or wearing)\b/gi, "");
  if ((/\sor\s/i).test(alternatives)) return "Conditional Attack";
  return name;
}

function damageConditionFamilyName(condition: string): string | null {
  if ((/\badvantage\b/i).test(condition)) return "Attack with Advantage";
  if ((/\b(?:at range|as a ranged weapon|(?:make|it[’']s) a ranged attack)\b/i).test(condition)) return "Ranged Attack";
  if ((/\b(?:in melee|as a melee weapon|make a melee attack)\b/i).test(condition)) return "Melee Attack";
  if ((/\bshillelagh\b/i).test(condition)) return "Shillelagh Attack";
  if ((/\b(?:moved|moves|move|flew|swam)\b.*\b(?:feet|ft|toward|straight)\b/i).test(condition)) return "Moving Attack";
  if ((/\bmounted\b/i).test(condition)) return "Mounted Attack";
  if ((/\b(?:can[’']?t|cannot) see\b/i).test(condition)) return "Unseen Attack";
  if ((/\bhalf\b.*\b(?:hit points|hp)\b|\b(?:hit points|hp)\b.*\bhalf\b/i).test(condition)) return "Bloodied Attack";
  if ((/\bbloodied\b/i).test(condition) && !(/\btarget\b/i).test(condition)) return "Bloodied Attack";
  if ((/\benlarged?\b/i).test(condition)) return "Enlarged Attack";
  if ((/\breduc(?:e|ed)\b/i).test(condition)) return "Reduced Attack";
  if ((/\braging\b/i).test(condition)) return "Raging Attack";
  if ((/\bon the ground\b/i).test(condition)) return "Grounded Attack";
  if ((/\bsworn vengeance\b/i).test(condition)) return "Vengeful Attack";
  const size = condition.match(/\b(?:is|in) (Tiny|Small|Medium|Large|Huge|Gargantuan)(?: or (?:larger|bigger))?\b/i);
  if (size && !(/\b(?:target|creature)\b/i).test(condition)) {
    return `Attack while ${size[1][0].toUpperCase()}${size[1].slice(1).toLowerCase()}`;
  }
  // "the target is a creature that is Large or bigger", "the target is Medium or larger"
  const targetSize = condition.match(/\btarget\b.*?\b(Tiny|Small|Medium|Large|Huge|Gargantuan)(?: or (larger|bigger|smaller))?\b/i);
  if (targetSize) {
    const range = targetSize[2] ? (targetSize[2].toLowerCase() === "smaller" ? " or Smaller" : " or Larger") : "";
    return `Attack against ${targetSize[1][0].toUpperCase()}${targetSize[1].slice(1).toLowerCase()}${range} Target`;
  }
  if ((/\btarget\b.*\b(?:fiend|undead)\b/i).test(condition)) {
    return (/\bfiend\b/i).test(condition) && (/\bundead\b/i).test(condition)
      ? "Attack against Fiend or Undead" : (/\bfiend\b/i).test(condition) ? "Attack against Fiend" : "Attack against Undead";
  }
  const targetType = condition.match(/\btarget\b.*?\b(object|human|aberration|celestial)\b/i);
  if (targetType) return `Attack against ${targetType[1][0].toUpperCase()}${targetType[1].slice(1).toLowerCase()}`;
  const status = condition.match(new RegExp(`\\b(${STATUSES})\\b`, "i"));
  if (status && (/\b(?:target|creature|enemy)\b/i).test(condition)) {
    return `Attack against ${status[1][0].toUpperCase()}${status[1].slice(1).toLowerCase()} Target`;
  }
  if ((/\btarget\b.*\bform other than its true form\b/i).test(condition)) return "Attack against Transformed Target";
  // DDB fixtures keep a rules tooltip as "Shape-Shifting;shape-shifted"
  if ((/\btarget\b.*\b(?:shape-?shift(?:ed|ing|er)|shapechanger)\b/i).test(condition)) return "Attack against Shape-Shifted Target";
  const form = condition.match(/\bin (?:its |the |a )?([\w-]+) form\b/i);
  if (form && !["a", "the", "its"].includes(form[1].toLowerCase())) {
    return `Attack in ${form[1][0].toUpperCase()}${form[1].slice(1).toLowerCase()} Form`;
  }
  return null;
}

/**
 * Partition a hit's numeric damage tokens using explicit conditional clauses. Indices refer
 * to the caller's tokens so dice parsing, source modifiers and damage types stay with it.
 * Unsupported or interacting clauses leave the entire hit untouched and return an advisory.
 *
 * Each token after the first is looked at against the text that joins it to the one before:
 * - "or ..." makes it a replacement: "7 (1d8 + 3) piercing damage, or 12 (2d8 + 3) piercing
 *   damage while enlarged" swaps the normal damage for the enlarged roll. The last conjunction
 *   decides, so "..., or 9 (1d10 + 4) if used with two hands, plus 18 (4d8) force damage" makes
 *   the force damage a rider of both, not an alternative;
 * - "plus ..." or a leading "If X, the target takes an extra ..." makes it additive: the bloodied
 *   rider in "... plus 7 (2d6) necrotic damage if the target is Bloodied" adds to the hit.
 * The condition is the leading "If" clause or the trailing "if/while/when/in/against" clause
 * ("at range" and "with shillelagh" too), and the scan walks forward over a plus-joined group
 * until the clause that names it (so one condition can own physical plus elemental damage). A
 * clause is dropped, not turned into a mode, when it is a save outcome, a damage type choice, or
 * sits in save or later turn damage (SAVE_OR_RECURRING_DAMAGE_CONTEXT). A replacement then takes
 * over the plus-joined group before it, whose damage types must cover the alternative's; a dice
 * only alternative of a rider's type ("plus 4 (1d8) radiant damage, or 9 (2d8) radiant damage if
 * ...") replaces that rider alone.
 *
 * A versatile two-handed alternative is not a mode: its tokens are left out of the normal hit and
 * every mode, and returned as the versatile attack's parts (the hit with the group it replaces
 * swapped for it). Each conditional clause becomes its own mode, built on the normal hit; clauses
 * that interact (one alternative replacing another clause's damage) or share a name leave the hit
 * unchanged with an advisory. The result lists the token indices of the normal hit, the modes
 * with their parts and names (monsterDamageModeName, or FALLBACK_MODE_NAME), and the text with
 * the conditional clauses cut out.
 *
 * Damage rolled only on a critical hit leaves every attack's parts and is returned as `critical`:
 * an extra ("If Arkhan rolls a 20 on the attack roll, the creature takes an extra 9 (2d8) necrotic
 * damage") by its tokens, an alternative ("or 20 (3d8 + 7) bludgeoning damage on a critical hit")
 * by the dice it adds beyond dnd5e's doubling. A critical extra with a condition of its own
 * ("Critical Hit: If the target is a shape-shifted creature, ...") is a mode whose `critical`
 * holds the extra instead.
 */
export function parseMonsterDamageModes(text: string, tokens: IMonsterDamageToken[]): IMonsterDamageModeResult {
  const all = tokens.map((_, index) => index);
  const unchanged = (warnings: string[] = []): IMonsterDamageModeResult => ({
    normal: all, modes: [], versatile: [], warnings, normalText: text, critical: null,
  });
  if (tokens.length < 2) return unchanged();

  const twoHanded = /(?:two|both) (?:hands|claws)|two-handed/i;
  const types = (index: number) => tokens[index].groups.type.toLowerCase().split(/\s+or\s+/).filter(Boolean);
  /** The plus-joined group of tokens before `index`, which an alternative at `index` replaces. */
  const precedingGroup = (index: number) => {
    let groupStart = index - 1;
    // Walk the source conjunctions, not the number of parts in the alternative.
    // One enlarged damage term can replace an entire plus-joined normal hit.
    while (groupStart > 0) {
      const left = tokens[groupStart - 1];
      const right = tokens[groupStart];
      const join = text.slice(left.index + left[0].length, right.index) + right.groups.prefix;
      if (!(/^\s*,?\s*(?:plus|and)\s*$/i).test(join)) break;
      groupStart--;
    }
    return all.slice(groupStart, index);
  };

  const candidates: (IMonsterDamageMode & { selected: number[]; replaced: number[]; criticalOnly: boolean })[] = [];
  const critical = { parts: [] as number[], alternatives: [] as number[], dice: [] as string[], creatureOnly: false };
  const warnings: string[] = [];
  const weaponAlternative: { selected: number[]; replaced: number[] } = { selected: [], replaced: [] };
  let consumedThrough = 0;
  for (let i = 1; i < tokens.length; i++) {
    if (i <= consumedThrough) continue;
    const token = tokens[i];
    const previous = tokens[i - 1];
    const previousEnd = previous.index + previous[0].length;
    const bridge = text.slice(previousEnd, token.index) + token.groups.prefix;
    const sentenceStart = Math.max(text.lastIndexOf(".", token.index), text.lastIndexOf("!", token.index)) + 1;
    const before = text.slice(sentenceStart, token.index) + token.groups.prefix;
    const lastConjunction = [...bridge.matchAll(/\b(or|plus)\b/gi)].at(-1)?.[1].toLowerCase();
    // "If the target is an object, the hit instead deals 16 slashing damage". After "the target has
    // the Frightened condition", "If the target is already Frightened, it instead takes 10 (3d6)
    // Psychic damage" is damage in place of the condition, so an extra on top of the hit.
    const leadingInstead = before.match(/\bIf\s+(.+?),?\s+(?:(?:the |that |this )?[\w'-]+\s+)?instead\s+(?:takes?|deals?)\s*$/i);
    const leadingReplacement = leadingInstead && !(/\balready\b/i).test(leadingInstead[1]) ? leadingInstead : null;
    const replacement = token.groups.prefix.trim().toLowerCase() === "or"
      || ((/(?:^|[,—])\s*or\s+[^.!?]*$/i).test(bridge) && lastConjunction === "or")
      || leadingReplacement !== null;
    const leading = before.match(/\bIf\s+(.+?)(?:,?\s+(?:(?:the |that |this )?[\w'-]+\s+)?(?:instead\s+)?(?:takes?|deals?)\s+(?:an?\s+)?(?:extra|additional))\s*$/i)
      ?? leadingInstead;
    const additive = token.groups.prefix.trim().toLowerCase() === "plus" || (leading !== null && !leadingReplacement);
    // "4 (1d8) bludgeoning damage if wielded with two hands" with no "or" before it
    if (!replacement && twoHanded.test(token.groups.suffix ?? "")) {
      weaponAlternative.selected.push(i);
      weaponAlternative.replaced.push(...precedingGroup(i));
      continue;
    }
    if (!replacement && !additive) continue;
    if (isDamageTypeChoice(text, token, previous.groups.dice ?? previous.groups.diceminor)) continue;
    // "or 8 (1d8 + 4) piercing damage if used with two hands": the rider after it is not its own
    if (replacement && twoHanded.test(token[0])) {
      weaponAlternative.selected.push(i);
      weaponAlternative.replaced.push(...precedingGroup(i));
      continue;
    }

    let last = i;
    let condition = leading?.[1]?.trim() ?? "";
    let clauseEnd = token.index + token[0].length;
    // An alternative can replace a group, such as physical plus elemental damage.
    // Its condition follows the last member. A closing em dash terminates the insertion.
    for (let j = i; j < tokens.length; j++) {
      const current = tokens[j];
      const end = current.index + current[0].length;
      const next = tokens[j + 1];
      const tail = text.slice(end, next?.index ?? text.length);
      const boundary = tail.search(/[.!?—]/);
      const suffix = boundary === -1 ? tail : tail.slice(0, boundary);
      // "plus 10 (3d6) Cold damage if the target is Prone, it takes an additional 5 (1d10) Slashing
      // damage" runs two sentences together: the condition is the next roll's leading clause
      const runOn = boundary === -1 && !!next
        && (/,\s*(?:(?:the |that |this )?[\w'-]+\s+)?(?:takes?|deals?)\s+(?:an?\s+)?(?:extra|additional)\s*$/i).test(suffix + next.groups.prefix);
      const trailing = runOn
        ? null
        : suffix.match(/^\s*(?:if|while|when|in|against)\s+(.+?)(?=,\s*(?:plus|and)\b|$)/i)
          ?? suffix.match(/^\s*()(at range|with shillelagh|on a critical hit)\b/i);
      if (trailing && !condition) {
        const keyword = suffix.trim().match(/^(if|while|when|in|against)\b/i)?.[1].toLowerCase();
        const phrase = trailing[2] ?? trailing[1];
        condition = `${keyword && keyword !== "if" ? `${keyword} ` : ""}${phrase}`.trim().replace(/[,;:!?\s]+$/, "");
      }
      clauseEnd = boundary === -1 ? end + suffix.length : end + boundary;
      // A comma resuming the outer hit has the same scope role as a closing dash.
      // For example, an alternate swarm bite may be followed by a shared poison rider.
      if (trailing && !leading) clauseEnd = Math.min(clauseEnd, end + trailing[0].length);
      if (condition) {
        last = j;
        break;
      }
      // Only an explicit alternative or dash-delimited insertion can own several parts.
      if (!(replacement || (/—\s*plus\b/i).test(bridge)) || boundary !== -1 || !next
        || !["plus", "and"].includes(next.groups.prefix.trim().toLowerCase())) break;
    }

    const clauseText = text.slice(token.index, clauseEnd);
    if (replacement && (twoHanded.test(condition) || twoHanded.test(clauseText))) {
      weaponAlternative.selected.push(...all.slice(i, last + 1));
      weaponAlternative.replaced.push(...precedingGroup(i));
      consumedThrough = last;
      continue;
    }
    if (!condition) {
      if (replacement) warnings.push("Alternative damage has no recognized condition boundary");
      continue;
    }
    if (twoHanded.test(condition) || twoHanded.test(clauseText)) continue;
    if ((/successful (?:save|saving throw)|failed (?:save|saving throw)/i).test(condition)) continue;
    // A condition after a saving throw, or a later turn's damage, is not a hit variant.
    if (SAVE_OR_RECURRING_DAMAGE_CONTEXT.test(text.slice(0, token.index))) continue;
    const start = leading ? sentenceStart + (leading.index ?? 0) : previousEnd;

    const crit = splitCriticalCondition(before, condition);
    if (crit.critical) {
      const selected = all.slice(i, last + 1);
      consumedThrough = last;
      if (!crit.rest || CREATURE_TARGET_CONDITION.test(crit.rest)) {
        if (!replacement) {
          critical.parts.push(...selected);
          if (crit.rest) critical.creatureOnly = true;
          continue;
        }
        const replaced = precedingGroup(i);
        const dice = selected.length === 1 && replaced.length === 1
          ? criticalAlternativeDice(tokens[replaced[0]], token)
          : null;
        if (dice === null) {
          warnings.push(`Critical damage alternative does not match the doubled hit: ${condition}`);
          continue;
        }
        critical.alternatives.push(...selected);
        if (dice) critical.dice.push(dice);
        continue;
      }
      // "Critical Hit: If the target is a shape-shifted creature, it takes an additional 4 (1d8)
      // Slashing damage" is a mode whose extra is rolled only on a critical hit
      const name = replacement ? null : monsterDamageModeName(crit.rest);
      if (!name) {
        warnings.push(`Unsupported damage condition: ${condition}`);
        continue;
      }
      candidates.push({
        name, condition: `${crit.rest} (extra damage on a critical hit)`, operation: "add", selected, replaced: [],
        criticalOnly: true, parts: [], critical: [], start, end: clauseEnd, text: text.slice(start, clauseEnd),
      });
      continue;
    }

    const name = monsterDamageModeName(condition)
      ?? (NO_FALLBACK_CONDITION.test(`${before} ${condition}`) ? null : FALLBACK_MODE_NAME);
    if (!name) {
      warnings.push(`Unsupported damage condition: ${condition}`);
      continue;
    }

    const selected = all.slice(i, last + 1);
    let replaced = replacement ? precedingGroup(i) : [];
    // "3 (1d6) damage, 4 (1d8) damage if wielded with two hands, or 6 (1d8 + 2) damage with
    // shillelagh" replaces the one-handed hit the versatile alternative stands beside
    if (replaced.length > 0 && replaced.every((index) => weaponAlternative.selected.includes(index))) {
      replaced = [...new Set(weaponAlternative.replaced)];
    }
    if (replacement && replaced.length !== selected.length) {
      const alternativeTypes = selected.flatMap(types);
      const lastReplaced = replaced.at(-1)!;
      const riderOnly = selected.length === 1
        && !(/[+-]|plus/i).test(tokens[i].groups.dice ?? "")
        && alternativeTypes.length > 0
        && alternativeTypes.every((type) => types(lastReplaced).includes(type))
        && !alternativeTypes.some((type) => types(replaced[0]).includes(type));
      if (riderOnly) {
        replaced = [lastReplaced];
      } else {
        // Assumption: "A plus B, or C" replaces the entire preceding group,
        // including differently typed riders absent from C. The type-subset check
        // identifies that group. This mixed-type interpretation is covered only
        // by synthetic tests; current captures establish the same-type case.
        const precedingTypes = new Set(replaced.flatMap(types));
        if (replaced.length < selected.length || !alternativeTypes.length
          || !alternativeTypes.every((type) => precedingTypes.has(type))) {
          warnings.push("Alternative damage group does not match the preceding hit");
          continue;
        }
      }
    }
    candidates.push({
      name, condition, operation: replacement ? "replace" : "add", selected, replaced,
      criticalOnly: false, parts: [], critical: [], start, end: clauseEnd, text: text.slice(start, clauseEnd),
    });
    consumedThrough = last;
  }
  if (warnings.length) return unchanged(warnings);
  const criticalTokens = new Set([...critical.parts, ...critical.alternatives]);
  if (candidates.length === 0 && criticalTokens.size === 0) return unchanged();
  const conditionalTokens = new Set(candidates.flatMap((candidate) => candidate.selected));
  // "or 9 (2d8) piercing damage if the minotaur is enlarged" after a moving rider replaces the rider
  if (candidates.some((candidate) => candidate.replaced.some((index) => conditionalTokens.has(index)))) {
    return unchanged(["Conditional damage alternatives of another conditional clause require explicit combined modes"]);
  }
  if (new Set(candidates.map((candidate) => candidate.name)).size !== candidates.length) {
    return unchanged(["Multiple conditional damage clauses share a mode name"]);
  }

  const versatileTokens = new Set(weaponAlternative.selected);
  const normal = all.filter((index) => !conditionalTokens.has(index) && !versatileTokens.has(index) && !criticalTokens.has(index));
  const versatile = versatileTokens.size === 0
    ? []
    : all.filter((index) => !conditionalTokens.has(index) && !weaponAlternative.replaced.includes(index)
      && !criticalTokens.has(index));
  const normalText = [...candidates].sort((a, b) => b.start - a.start)
    .reduce((result, candidate) => result.slice(0, candidate.start) + result.slice(candidate.end), text);
  return {
    normal,
    modes: candidates.map(({ criticalOnly, ...candidate }) => ({
      ...candidate,
      parts: all.filter((index) => !versatileTokens.has(index) && !criticalTokens.has(index)
        && !candidate.replaced.includes(index)
        && (!conditionalTokens.has(index) || (!criticalOnly && candidate.selected.includes(index)))),
      critical: criticalOnly ? candidate.selected : [],
    })),
    versatile,
    warnings: [],
    normalText,
    critical: critical.parts.length || critical.dice.length
      ? { parts: critical.parts, dice: critical.dice, creatureOnly: critical.creatureOnly }
      : null,
  };
}
