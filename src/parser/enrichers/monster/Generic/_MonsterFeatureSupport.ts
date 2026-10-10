import { ACTOR } from "../../../../config/dictionary/actor/actor";
import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBMonsterFeature from "../../../monster/features/DDBMonsterFeature";

/**
 * Source-text helpers for monster families whose numbers and rules vary between stat blocks.
 * Parser-built activities are named after the stat block's section labels, so an effect meant for
 * one of them should select it with `activityTypesMatch` (and `activityIdsExclude` for an
 * enricher-built sibling of the same type) rather than a guessed `activityMatch` name. Do not link
 * effects by hand in cleanup: the shared linking pass is what assigns effect ids and applies
 * onSave, level and rider data.
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
    // later-turn damage written in the hit is parsed apart from the hit's own parts
    const parsed = [...(this.parser.actionData?.damageParts ?? []), ...(this.parser.ddbMonsterDamage?.recurringParts ?? [])];
    const existing = parsed.find(
      (p) => normalize(p.damageString) === normalize(formula) && p.damageTypes.includes(type as I5eDamageType),
    );
    if (existing) return foundry.utils.deepClone(existing.part);
    const ability = this.parser.actionData?.baseAbility;
    const score = ability ? this.parser.ddbMonster?.npc.system.abilities?.[ability]?.value : undefined;
    if (score !== undefined) {
      const mod = Math.floor((score - 10) / 2);
      const dynamic = parsed.find(
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

  /**
   * The words of one labelled option, from just after "<label>." to the next of `labels` or the
   * end of the text. Null when the label is not in the text.
   */
  optionText(label: string, labels: string[]): string | null {
    const start = this.text.indexOf(`${label}.`);
    if (start < 0) return null;
    const from = start + label.length + 1;
    const ends = labels.map((other) => this.text.indexOf(`${other}.`, from)).filter((index) => index >= 0);
    return this.text.slice(from, ends.length > 0 ? Math.min(...ends) : undefined).trim();
  }

  sentences(text: string): string[] {
    return text.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
  }

  /** A full target block, which a partial targetOverride would otherwise leave half filled. */
  static targetWith(
    affects: { type?: string; count?: string; choice?: boolean },
    area: { type: string; size: string } | null = null,
  ): I5eActivityTarget {
    return {
      affects: { type: affects.type ?? "creature", count: affects.count ?? "", choice: affects.choice ?? false, special: "" },
      template: {
        count: area ? "1" : "",
        contiguous: false,
        type: area?.type ?? "",
        size: area?.size ?? "",
        width: "",
        height: "",
        units: "ft",
      },
      override: false,
      prompt: true,
    } as I5eActivityTarget;
  }

  /**
   * A save read from one sentence: its roll, its DC, the damage it names and whether a success
   * halves it. `save` supplies the roll where the sentence leaves the DC to an earlier one. Null
   * when the sentence names no save.
   */
  saveExtra(
    name: string, id: string, sentence: string, build: IDDBActivityBuild = {}, save: I5eActivitySave | null = this.save(sentence),
  ): IDDBAdditionalActivity | null {
    if (!save) return null;
    const damageParts = this.damageTokens(sentence).map((token) => token.part);
    return this.extra(name, id, "save", {
      generateSave: true,
      saveOverride: save,
      generateDamage: damageParts.length > 0,
      damageParts,
      onSave: (/\bhalf as much\b|\bhalf damage\b/i).test(sentence) ? "half" : "none",
      ...build,
    });
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
