import { ACTOR } from "../../../../config/dictionary/actor/actor";
import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBMonsterFeature from "../../../monster/features/DDBMonsterFeature";

/**
 * Source-text helpers for monster families whose numbers and rules vary between stat blocks.
 * Effects linked manually in cleanup use a deliberately unmatched activityMatch (for example,
 * "Initial Effect", "Grappling Hit", or "Consume Life Save") to skip shared activity linking.
 * That linking pass runs before cleanup, which selects the intended activities by type or ID.
 * Cleanup must deduplicate links in case a parsed activity happens to have the sentinel name.
 */
export default abstract class _MonsterFeatureSupport extends DDBEnricherData {
  get parser(): DDBMonsterFeature {
    return this.ddbParser as DDBMonsterFeature;
  }

  get text(): string {
    return (this.parser.strippedHtml ?? "").replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
  }

  get key(): string {
    return this.name.split("(")[0].trim();
  }

  get activities(): IActivityData[] {
    return Object.values(this.document.system.activities ?? {});
  }

  /** Retain the parser's ability formula when the source damage token already has a parsed part. */
  damage(formula: string, type: string): I5eDamagePart {
    const normalize = (value: string) => value.replace(/\s/g, "");
    const existing = this.parser.actionData?.damageParts.find(
      (p) => normalize(p.damageString) === normalize(formula) && p.damageTypes.includes(type as I5eDamageType),
    );
    if (existing) return foundry.utils.deepClone(existing.part);
    const ability = this.parser.actionData?.baseAbility;
    const score = ability ? this.parser.ddbMonster?.npc.system.abilities?.[ability]?.value : undefined;
    if (score !== undefined) {
      const mod = Math.floor((score - 10) / 2);
      const dynamic = this.parser.actionData.damageParts.find(
        (p) =>
          p.damageHasMod &&
          normalize(p.damageString.replace("@mod", String(mod))) === normalize(formula) &&
          p.damageTypes.includes(type as I5eDamageType),
      );
      if (dynamic) return foundry.utils.deepClone(dynamic.part);
    }
    const dice = formula.match(/^(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
    return _MonsterFeatureSupport.basicDamagePart(
      dice
        ? {
          number: Number(dice[1]),
          denomination: Number(dice[2]),
          bonus: dice[3] ? `${dice[3] === "-" ? "-" : ""}${dice[4]}` : "",
          type,
          scalingMode: "none",
          scalingNumber: null,
        }
        : { bonus: formula, type, scalingMode: "none", scalingNumber: null },
    );
  }

  /** Damage clauses use a fixed average optionally followed by a dice formula. */
  damageTokens(text: string): { index: number; end: number; part: I5eDamagePart }[] {
    return [
      ...text.matchAll(
        /\b(\d+)(?:\s*\((\d+d\d+(?:\s*[+-]\s*\d+)?)\))?\s+(acid|bludgeoning|cold|fire|force|lightning|necrotic|piercing|poison|psychic|radiant|slashing|thunder) damage/gi,
      ),
    ].map((m) => ({ index: m.index, end: m.index + m[0].length, part: this.damage(m[2] ?? m[1], m[3].toLowerCase()) }));
  }

  check(text = this.text): I5eActivityCheck | null {
    const m = text.match(
      /DC\s*(\d+)\s+(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)(?:\s*\(([^)]+)\))?\s+check/i,
    );
    if (!m) return null;
    const skill = ACTOR.skills.find((s) => s.label.toLowerCase() === m[3]?.trim().toLowerCase());
    return {
      ability: m[2].slice(0, 3).toLowerCase(),
      associated: skill ? [skill.name] : [],
      dc: { calculation: "", formula: m[1] },
    };
  }

  save(text = this.text): I5eActivitySave | null {
    const modern = text.match(
      /(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) Saving Throw:\s*DC\s*(\d+)/i,
    );
    const legacy = text.match(
      /DC\s*(\d+)\s+(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) saving throw/i,
    );
    if (!modern && !legacy) return null;
    return {
      ability: [(modern?.[1] ?? legacy![2]).slice(0, 3).toLowerCase()],
      dc: { calculation: "", formula: modern?.[2] ?? legacy![1] },
    };
  }

  seconds(text: string): number | null {
    const m = text.match(/for (\d+|a|an|one) (minute|hour|day)s?/i);
    return m ? (Number(m[1]) || 1) * ({ minute: 60, hour: 3600, day: 86400 }[m[2].toLowerCase()] ?? 1) : null;
  }

  /** Secondary rolls do not reuse the primary activity's resource, area, damage, or effects. */
  extra(name: string, id: string, type: IDDBActivityType, build: IDDBActivityBuild = {}): IDDBAdditionalActivity {
    return {
      init: { name, id, type },
      build: {
        generateActivation: true,
        generateConsumption: false,
        generateDamage: false,
        generateTarget: true,
        generateRange: true,
        includeBaseDamage: false,
        activationOverride: { type: "special", value: null, condition: "" },
        targetOverride: { affects: { type: "creature", count: "1", choice: false }, template: { type: "" } },
        rangeOverride: { units: "any" },
        ...build,
      },
      overrides: { noConsumeTargets: true, noeffect: true },
    };
  }
}
