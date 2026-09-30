import DDBEnricherData from "../data/DDBEnricherData";

/**
 * AU general feat, three ability variants collapse here. Intercept Attack is the familiar's
 * Reaction adding the proficiency bonus to a nearby creature's AC against one hit. Battle
 * Familiar's free daily cast arrives with DDB's granted spell, not here.
 */
export default class WarlikeFamiliar extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Intercept Attack",
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "A creature within 5 feet of your familiar is hit by an attack roll; your familiar takes the Reaction",
      noConsumeTargets: true,
      noTemplate: true,
      data: {
        range: { units: "spec", special: "5 feet of your familiar" },
        roll: {
          prompt: false,
          visible: true,
          name: "Armor Class Bonus",
          formula: "@prof",
        },
      },
    };
  }

}
