import DDBEnricherData from "../../data/DDBEnricherData";

export default class GraspingTentacles extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
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

  override get override(): IDDBOverrideData {
    return {
      forceSpellAdvancement: true,
    };
  }

}
