import DDBEnricherData from "../../data/DDBEnricherData";

export default class GraspingTentacles extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@classes.warlock.levels",
          types: ["temphp"],
        }),
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      forceSpellAdvancement: true,
    };
  }

}
