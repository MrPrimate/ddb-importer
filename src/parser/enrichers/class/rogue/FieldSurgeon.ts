import DDBEnricherData from "../../data/DDBEnricherData";

/** Grim Surgeon: at the end of a short rest, a willing creature in reach regains Hit Points equal to your Sneak Attack dice, once per long rest. */
export default class FieldSurgeon extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "Choose a willing creature within reach at the start of a short rest; it heals at the end",
      data: {
        range: { override: true, units: "touch" },
        healing: DDBEnricherData.basicDamagePart({ customFormula: "@scale.grim-surgeon.field-surgeon", types: ["healing"] }),
      },
    };
  }

}
