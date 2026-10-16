import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The Eye and Hand of Vecna together. The parser's single save merged the hand's Icy Touch dice
 * (2d8 cold) with the paired artifacts' own attack. Icy Touch is now a melee damage rule (any melee
 * spell attack with the hand or melee weapon attack with a weapon it holds), and the save is the
 * pair's property: 2024 Necrotic Reduction (DC 18 Con, 7d6 necrotic, half on a success), 2014 a
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

  override get effects(): IDDBEffectHint[] {
    const effects: IDDBEffectHint[] = [
      {
        name: "Icy Touch",
        // passive: keep the item text's durations off it
        options: {
          transfer: true,
          durationSeconds: null,
          expiry: null,
          description: "Melee spell attacks with the hand and melee attacks with a weapon it holds deal an extra 2d8 Cold damage on a hit.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleBonusChange("damage", "2d8[cold]", {
            conditions: DDBEnricherData.ChangeHelper.MELEE_ATTACK_FILTER,
          }),
        ],
      },
    ];
    if (!this.is2014) {
      effects.push({
        name: "Eye and Hand Together",
        options: { transfer: true, durationSeconds: null, expiry: null },
        changes: [
          DDBEnricherData.ChangeHelper.damageImmunityChange("poison"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("poisoned"),
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "flags.dnd5e.initiativeAdv"),
        ],
      });
    }
    return effects;
  }

}
