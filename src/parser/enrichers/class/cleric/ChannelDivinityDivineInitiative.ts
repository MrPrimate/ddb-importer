import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityDivineInitiative extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get type(): IDDBActivityType | null {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.HEAL : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      targetType: "ally",
      targetCount: "max(1, @abilities.wis.mod)",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "5 + 3 * (min(floor(@classes.cleric.levels / 6), 1) + min(floor(@classes.cleric.levels / 8), 1) + min(floor(@classes.cleric.levels / 17), 1))",
          types: ["temphp"],
        }),
        range: {
          units: "ft",
          value: "60",
        },
      },
    };
  }

}
