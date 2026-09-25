const STATUSES = "bloodied|grappled|prone|poisoned|frightened|restrained|stunned|paralyzed|incapacitated|unconscious|blinded|deafened";

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
  if ((/\b(?:moved|moves|flew)\b.*\b(?:feet|ft|toward|straight)\b/i).test(condition)) return "Moving Attack";
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
 */
export function parseMonsterDamageModes(text: string, tokens: IMonsterDamageToken[]): IMonsterDamageModeResult {
  const all = tokens.map((_, index) => index);
  const unchanged = (warnings: string[] = []): IMonsterDamageModeResult => ({
    normal: all, modes: [], warnings, normalText: text,
  });
  if (tokens.length < 2) return unchanged();

  const candidates: (IMonsterDamageMode & { selected: number[]; replaced: number[] })[] = [];
  const warnings: string[] = [];
  let hasWeaponAlternative = false;
  let consumedThrough = 0;
  for (let i = 1; i < tokens.length; i++) {
    if (i <= consumedThrough) continue;
    const token = tokens[i];
    const previous = tokens[i - 1];
    const previousEnd = previous.index + previous[0].length;
    const bridge = text.slice(previousEnd, token.index) + token.groups.prefix;
    const sentenceStart = Math.max(text.lastIndexOf(".", token.index), text.lastIndexOf("!", token.index)) + 1;
    const before = text.slice(sentenceStart, token.index) + token.groups.prefix;
    const replacement = token.groups.prefix.trim().toLowerCase() === "or"
      || (/(?:^|[,\u2014])\s*or\s+[^.!?]*$/i).test(bridge);
    const leading = before.match(/\bIf\s+(.+?)(?:,?\s+(?:(?:the |that )?[\w'-]+\s+)?(?:instead\s+)?(?:takes?|deals?)\s+(?:an?\s+)?(?:extra|additional))\s*$/i);
    const additive = token.groups.prefix.trim().toLowerCase() === "plus" || leading !== null;
    if (!replacement && !additive) continue;

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
      const boundary = tail.search(/[.!?\u2014]/);
      const suffix = boundary === -1 ? tail : tail.slice(0, boundary);
      const trailing = suffix.match(/^\s*(?:if|while|when|in|against)\s+(.+?)(?=,\s*(?:plus|and)\b|$)/i);
      if (trailing && !condition) {
        const keyword = suffix.trim().match(/^(if|while|when|in|against)\b/i)![1].toLowerCase();
        condition = `${keyword === "if" ? "" : `${keyword} `}${trailing[1]}`.trim().replace(/[,;:!?\s]+$/, "");
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
      if (!(replacement || (/\u2014\s*plus\b/i).test(bridge)) || boundary !== -1 || !next
        || !["plus", "and"].includes(next.groups.prefix.trim().toLowerCase())) break;
    }

    if (!condition) {
      if (replacement) {
        if ((/(?:two|both) (?:hands|claws)|two-handed/i).test(text.slice(token.index, clauseEnd))) {
          hasWeaponAlternative = true;
        } else {
          warnings.push("Alternative damage has no recognized condition boundary");
        }
      }
      continue;
    }
    if ((/(?:two|both) (?:hands|claws)|two-handed/i).test(condition)
      || (/(?:two|both) (?:hands|claws)/i).test(text.slice(token.index, clauseEnd))) {
      if (replacement) hasWeaponAlternative = true;
      continue;
    }
    if ((/successful (?:save|saving throw)|failed (?:save|saving throw)/i).test(condition)) continue;
    const name = monsterDamageModeName(condition);
    if (!name) {
      warnings.push(`Unsupported damage condition: ${condition}`);
      continue;
    }
    // A condition after a saving throw, or a later turn's damage, is not a hit variant.
    const context = text.slice(0, token.index);
    if ((/saving throw|\bat (?:the |each )?(?:start|end) of (?:each|its|the|their)|\b(?:Failure|Success):/i).test(context)) continue;

    const selected = all.slice(i, last + 1);
    let groupStart = i - 1;
    if (replacement) {
      // Walk the source conjunctions, not the number of parts in the alternative.
      // One enlarged damage term can replace an entire plus-joined normal hit.
      while (groupStart > 0) {
        const left = tokens[groupStart - 1];
        const right = tokens[groupStart];
        const join = text.slice(left.index + left[0].length, right.index) + right.groups.prefix;
        if (!(/^\s*,?\s*(?:plus|and)\s*$/i).test(join)) break;
        groupStart--;
      }
    }
    const replaced = replacement ? all.slice(groupStart, i) : [];
    if (replacement && replaced.length !== selected.length) {
      // Assumption: "A plus B, or C" replaces the entire preceding group,
      // including differently typed riders absent from C. The type-subset check
      // identifies that group. This mixed-type interpretation is covered only
      // by synthetic tests; current captures establish the same-type case.
      const types = (index: number) => tokens[index].groups.type.toLowerCase().split(/\s+or\s+/).filter(Boolean);
      const precedingTypes = new Set(replaced.flatMap(types));
      const alternativeTypes = selected.flatMap(types);
      if (replaced.length < selected.length || !alternativeTypes.length
        || !alternativeTypes.every((type) => precedingTypes.has(type))) {
        warnings.push("Alternative damage group does not match the preceding hit");
        continue;
      }
    }
    const start = leading ? sentenceStart : previousEnd;
    candidates.push({
      name, condition, operation: replacement ? "replace" : "add", selected, replaced,
      parts: [], start, end: clauseEnd, text: text.slice(start, clauseEnd),
    });
    consumedThrough = last;
  }
  if (warnings.length) return unchanged(warnings);
  if (candidates.length && hasWeaponAlternative) {
    return unchanged(["Conditional damage combined with versatile weapon use requires explicit combined modes"]);
  }
  if (candidates.length > 1) return unchanged(["Multiple conditional damage clauses require explicit combined modes"]);
  const candidate = candidates[0];
  if (!candidate) return unchanged();
  const normal = all.filter((index) => !candidate.selected.includes(index));
  const modeParts = all.filter((index) => !candidate.replaced.includes(index));
  return {
    normal,
    modes: [{ ...candidate, parts: modeParts }],
    warnings: [],
    normalText: text.slice(0, candidate.start) + text.slice(candidate.end),
  };
}
