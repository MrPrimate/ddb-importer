import DDBEnricherData from "../../data/DDBEnricherData";

/** Circle of the Hive: while Symbiotic Biosphere is active, a reaction reduces incoming damage by Wisdom modifier + half druid level. */
export default class ProtectTheMonarch extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "reaction",
      activationCondition: "You take damage from a source you can see while Symbiotic Biosphere is active",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "@abilities.wis.mod + floor(@classes.druid.levels / 2)",
          name: "Damage Reduction",
        },
      },
    };
  }

}
