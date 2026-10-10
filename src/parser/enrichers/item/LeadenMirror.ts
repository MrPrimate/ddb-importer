import DDBEnricherData from "../data/DDBEnricherData";
import SpellComponentItem from "./_SpellComponentItem";

/** The Magus Class: consumed when a Counterspell target fails its save; it loses the slot and takes 1d6 Force per level of its spell (picked as the scaling). */
export default class LeadenMirror extends SpellComponentItem {

  override get spellName(): string {
    return "Counterspell";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get componentActivity(): IDDBActivityData {
    return {
      activationCondition: "When you cast Counterspell and the target fails its save; pick the countered spell's level as the scaling",
      targetType: "creature",
      targetCount: 1,
      addConsumptionScalingMax: "9",
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ customFormula: "(@scaling)d6", types: ["force"], scalingMode: "none" }),
      ],
    };
  }

}
