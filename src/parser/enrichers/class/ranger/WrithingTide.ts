import DDBEnricherData from "../../data/DDBEnricherData";

export default class WrithingTide extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.upgradeChange("true", 20, "system.attributes.movement.hover"),
        ],
      },
    ];
  }

}
