import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Arcana Unleashed general feat. Protective Ward grants temporary hit points equal to twice the
 * level of the abjuration spell's slot. The slot level is not known when the feat is used, so the
 * activity asks for it through the scaling prompt with no consumption target; dnd5e counts
 * `@scaling` from 1, so the prompt value is the slot level.
 */
export default class AbjurationAdept extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Protective Ward",
      targetType: "creature",
      activationType: "special",
      activationCondition: "When you cast an Abjuration spell using a spell slot (scaling: the slot level)",
      noConsumeTargets: true,
      addConsumptionScalingMax: "9",
      noTemplate: true,
      data: {
        range: { value: "30", units: "ft" },
        healing: DDBEnricherData.basicDamagePart({ customFormula: "2 * @scaling", types: ["temphp"], scalingMode: "none" }),
      },
    };
  }

}
