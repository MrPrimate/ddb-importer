import DDBEnricherData from "../data/DDBEnricherData";
import { conditionalWeaponDamage } from "./_ItemActivities";

/**
 * The Eye and Hand of Vecna together. The parser's single save merged the hand's Icy Touch dice
 * (2d8 cold) with the paired artifacts' own attack. Icy Touch is now its own damage activity, rolled
 * after a melee spell attack with the hand or a melee weapon attack with a weapon it holds (dnd5e 5.x
 * has no rule changes to gate it on the attack), and the save is the pair's property: 2024 Necrotic Reduction (DC 18 Con, 7d6 necrotic, half on a success), 2014 a
 * melee touch that drops the target to 0 Hit Points on a failed DC 18 Con save. The 2024 record's
 * "attuned to both" benefits (poison and Poisoned immunity, Initiative advantage) are dropped by the
 * parser's restriction filter, but this record is both artifacts, so they always apply.
 */
export default class EyeAndHandOfVecna extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    if (this.is2014) {
      return {
        name: "Deadly Touch",
        activationType: "action",
        activationCondition: "Hit a creature you can reach with a melee attack (weapon or spell attack bonus)",
        noConsumeTargets: true,
        targetType: "creature",
        targetCount: "1",
        data: {
          range: { override: true, units: "touch" },
          save: { ability: ["con"], dc: { calculation: "", formula: "18" } },
          damage: { onSave: "none", parts: [] },
        },
      };
    }
    return {
      name: "Necrotic Reduction",
      activationType: "action",
      noConsumeTargets: true,
      targetType: "creature",
      targetCount: "1",
      data: {
        range: { override: true, value: "5", units: "ft" },
        save: { ability: ["con"], dc: { calculation: "", formula: "18" } },
        damage: {
          onSave: "half",
          parts: [DDBEnricherData.basicDamagePart({ number: 7, denomination: 6, types: ["necrotic"] })],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      conditionalWeaponDamage(
        "Icy Touch",
        [DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, types: ["cold"] })],
        "Hit with a melee spell attack using the hand, or a melee weapon attack with a weapon it holds",
      ),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.is2014) return [];
    return [{
      name: "Eye and Hand Together",
      options: { transfer: true, durationSeconds: null, expiry: null },
      changes: [
        DDBEnricherData.ChangeHelper.damageImmunityChange("poison"),
        DDBEnricherData.ChangeHelper.conditionImmunityChange("poisoned"),
        DDBEnricherData.ChangeHelper.overrideChange("1", 20, "flags.dnd5e.initiativeAdv"),
      ],
    }];
  }

}
