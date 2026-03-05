import DDBEnricherData from "../../data/DDBEnricherData";

export default class GuardianArmorDefensiveField extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          bonus: "@classes.artificer.levels",
          types: ["temphp"],
        }),
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [];
  }
}
