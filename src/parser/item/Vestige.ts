import { utils } from "../../lib/_module";
import { Effects } from "../enrichers/_module";
import type DDBItem from "./DDBItem";

export type TVestigeStage = "dormant" | "awakened" | "exalted";

export interface IVestigeStageSection {
  // null marks the preamble that precedes the first stage heading
  stage: TVestigeStage | null;
  text: string;
}

/**
 * The charge-text helpers this module borrows.
 */
export interface IVestigeChargeParser {
  getRechargeFormula(description: string, maxCharges: number): string;
  getMagicItemResetType(description: string): TLimitedUsePeriod | null;
}

/**
 * Vestiges of Divergence and similar multi-stage magic items. DDB ships each stage as a separate
 * item definition suffixed "(Dormant)"/"(Awakened)"/"(Exalted)", but every stage's description
 * carries the cumulative text of all lower stages, so reading the first charge count found in a
 * description always reports the dormant numbers.
 */
export default class Vestige {

  static STAGES: readonly TVestigeStage[] = ["dormant", "awakened", "exalted"];

  /**
   * The stage a DDB item name declares, e.g. "Jewel of Three Prayers (Exalted)" -> "exalted".
   * Anchored to the end of the name on purpose: "Cabal's Ruin (Exalted) (Legacy)" returns null,
   * which is why callers must pass originalName rather than the (possibly suffixed) document name.
   */
  static getStage(name: string | null | undefined): TVestigeStage | null {
    if (!name) return null;
    const match = (/\((Dormant|Awakened|Exalted)\)\s*$/i).exec(name);
    return match ? (match[1].toLowerCase() as TVestigeStage) : null;
  }

  /**
   * Split a raw DDB description at its stage headings. Always returns at least the preamble.
   * Two heading markups occur in DDB data: an <h4> (optionally wrapping inline tags), and a
   * bolded "<stage> State." lead-in on a paragraph.
   */
  static splitDescription(description: string): IVestigeStageSection[] {
    if (!description) return [{ stage: null, text: "" }];
    const headingRegex
      = /<h[1-6][^>]*>(?:\s|<[^>]+>|&nbsp;)*(dormant|awakened|exalted)(?:\s|&nbsp;)*(?:<\/[^>]+>|\s)*<\/h[1-6]>|<p>(?:\s|<[^>]+>|&nbsp;)*(dormant|awakened|exalted)(?:&nbsp;|\s)*state\b/gi;

    const marks: { stage: TVestigeStage; start: number; end: number }[] = [];
    for (const match of description.matchAll(headingRegex)) {
      const stage = (match[1] ?? match[2]).toLowerCase() as TVestigeStage;
      marks.push({ stage, start: match.index, end: match.index + match[0].length });
    }

    if (marks.length === 0) return [{ stage: null, text: description }];

    const sections: IVestigeStageSection[] = [{ stage: null, text: description.slice(0, marks[0].start) }];
    for (let i = 0; i < marks.length; i++) {
      const end = i + 1 < marks.length ? marks[i + 1].start : description.length;
      sections.push({ stage: marks[i].stage, text: description.slice(marks[i].end, end) });
    }
    return sections;
  }

  /**
   * Charges as of the stage declared by `name`, or null when this is not a staged item or no
   * charge count could be found (in which case callers fall back to the whole-description scan).
   */
  static getStageUses(
    name: string | null | undefined, description: string, charges: IVestigeChargeParser,
  ): I5eSystemLimitedUses | null {
    const target = Vestige.getStage(name);
    if (!target) return null;
    return Vestige.getUsesAtStage(target, description, charges);
  }

  /**
   * As getStageUses, but for an explicitly chosen stage. Used for the unsuffixed base item, whose
   * description holds every stage and whose name therefore declares none.
   *
   */
  static getUsesAtStage(
    target: TVestigeStage, description: string, charges: IVestigeChargeParser,
  ): I5eSystemLimitedUses | null {
    if (!description) return null;

    const targetIndex = Vestige.STAGES.indexOf(target);
    const absoluteRegex = /has,? (\d+) charges/i;
    const deltaRegex = /(?:number of )?charges increases to (\d+)/i;

    let max: number | null = null;
    let formula: string | null = null;
    let recoverAll = false;
    let resetType: TLimitedUsePeriod | null = null;
    let reached = false;

    for (const section of Vestige.splitDescription(description)) {
      if (section.stage !== null && Vestige.STAGES.indexOf(section.stage) > targetIndex) break;
      if (section.stage === target) reached = true;

      const chargeMatch = absoluteRegex.exec(section.text) ?? deltaRegex.exec(section.text);
      if (chargeMatch?.[1]) max = parseInt(chargeMatch[1]);

      const sectionResetType = charges.getMagicItemResetType(section.text);
      if (sectionResetType) resetType = sectionResetType;

      // Guard on max: getRechargeFormula falls back to its maxCharges argument, so calling it
      // before a charge count is known (e.g. a preamble mentioning "regains") yields "null".
      if (max !== null && (/regains/i).test(section.text)) {
        formula = charges.getRechargeFormula(section.text, max);
        // Carried as a boolean rather than re-derived later: a stage that inherits its recharge
        // keeps the earlier formula string, which no longer equals the raised max.
        recoverAll = `${formula}` === `${max}`;
      }
    }

    if (!reached || max === null) return null;

    const recovery: I5eSystemLimitedUsesRecovery[] = [];
    if (resetType && !["", "charges"].includes(resetType)) {
      recovery.push({
        period: resetType,
        type: recoverAll ? "recoverAll" : "formula",
        formula: recoverAll ? "" : (formula ?? `${max}`),
      });
    }

    return {
      max: `${max}`,
      spent: 0,
      recovery,
    };
  }

  /**
   * The unsuffixed base item (plain "Jewel of Three Prayers") ships the full cumulative text, so it
   * imports as its dormant self. Give it a self-targeting enchant activity per higher stage that
   * raises it in place, rather than silently discarding the awakened/exalted numbers.
   *
   * Only charges are generic enough to derive here. Richer stage benefits (extra spells, damage
   * resistances, new activities) are per item and belong in an enricher.
   */
  static generateStageEnchantments(item: DDBItem, charges: IVestigeChargeParser): void {
    if (!item.isMuncher) return;
    if (item.documentType === "container") return;
    // suffixed items already are a single stage; nothing to raise them to
    if (Vestige.getStage(item.originalName)) return;

    const description = item.ddbDefinition.description;
    const sections = Vestige.splitDescription(description);
    if (!sections.some((section) => section.stage !== null)) return;

    const dormantUses = Vestige.getUsesAtStage("dormant", description, charges);
    if (!dormantUses?.max) return;

    let previousUses = dormantUses;
    for (const stage of Vestige.STAGES) {
      if (stage === "dormant") continue;
      if (!sections.some((section) => section.stage === stage)) continue;

      const stageUses = Vestige.getUsesAtStage(stage, description, charges);
      if (!stageUses?.max || stageUses.max === previousUses.max) continue;

      const stageName = utils.capitalize(stage);
      const activityName = `${stageName} State`;

      const effect = Effects.EnchantmentEffects.EnchantmentEffect(item.data, stageName);
      effect.system ??= {};
      effect.system.changes ??= [];
      effect.system.changes.push(
        Effects.ChangeHelper.overrideChange(`{} (${stageName})`, 20, "name"),
        Effects.ChangeHelper.overrideChange(stageUses.max, 20, "system.uses.max"),
      );
      if (JSON.stringify(stageUses.recovery) !== JSON.stringify(previousUses.recovery)) {
        effect.system.changes.push(
          Effects.ChangeHelper.overrideChange(JSON.stringify(stageUses.recovery), 20, "system.uses.recovery"),
        );
      }
      // Stops _activityEffectLinking attaching this enchantment to every other activity on the
      // item that has no effects of its own, e.g. the item's ordinary dormant activities.
      foundry.utils.setProperty(effect, "flags.ddbimporter.activityMatch", activityName);

      item.data.effects ??= [];
      item.data.effects.push(effect);

      const activity = item._getEnchantActivity({ name: activityName, nameIdPostfix: stage });
      foundry.utils.mergeObject(activity.data, {
        enchant: { self: true },
        restrictions: { type: "", categories: [], properties: [], allowMagical: true },
        // Linking the effect here rather than letting _activityEffectLinking do it: an activity
        // with an empty effects array collects every unmatched effect on the item, which would
        // hand this enchantment the item's unrelated ones (a rider status effect, say).
        effects: [{
          _id: effect._id,
          level: { min: null, max: null },
          riders: { activity: [], effect: [], item: [] },
        }],
      });
      item.activities.push(activity);
      foundry.utils.setProperty(item.data, `system.activities.${activity.data._id}`, activity.data);

      previousUses = stageUses;
    }
  }

}
