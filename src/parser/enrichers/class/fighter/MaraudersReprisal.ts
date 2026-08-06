import DDBEnricherData from "../../data/DDBEnricherData";

export default class MaraudersReprisal extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get type() {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.HEAL : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get activity(): IDDBActivityData {
    if (!this.isAction) return {};
    return {
      targetType: "self",
      activationCondition: "You become Bloodied or a creature scores a Critical Hit against you; the reaction attack scores a Critical Hit",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "floor(@classes.fighter.levels / 2)",
          types: ["temphp"],
        }),
      },
    };
  }

}
