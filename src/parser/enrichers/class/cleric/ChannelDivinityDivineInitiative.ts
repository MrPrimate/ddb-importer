import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityDivineInitiative extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get type(): IDDBActivityType | null {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.HEAL : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      targetType: "ally",
      targetCount: "max(1, @abilities.wis.mod)",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: `5 + 3 * (min(floor(@classes.${this.classIdentifier("Cleric")}.levels / 6), 1) + min(floor(@classes.${this.classIdentifier("Cleric")}.levels / 8), 1) + min(floor(@classes.${this.classIdentifier("Cleric")}.levels / 17), 1))`,
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
