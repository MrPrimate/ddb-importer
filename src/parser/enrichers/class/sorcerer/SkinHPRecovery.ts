import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Oni Sorcery Arcane Prison (Skin): casting a leveled spell restores hit points equal to its level
 * plus your Constitution modifier. Nothing records the slot, so the scaling step is the level minus one.
 */
export default class SkinHPRecovery extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "You cast a spell of level 1 or higher (not when the Tongue trait is active for that casting)",
      noConsumeTargets: true,
      data: {
        consumption: {
          targets: [],
          scaling: { allowed: true, max: "9" },
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "1 + @abilities.con.mod",
          types: ["healing"],
          scalingMode: "whole",
          scalingFormula: "1",
        }),
      },
    };
  }

}
