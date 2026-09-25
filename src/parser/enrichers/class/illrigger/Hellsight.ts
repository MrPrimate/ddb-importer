import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

export default class Hellsight extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Hellsight",
      ..._Illrigger.sealConsume(),
      activationType: "action",
      targetType: "self",
      rangeSelf: true,
      data: {
        duration: {
          units: "hour",
          value: "1",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hellsight",
        activityMatch: "Hellsight",
        options: {
          durationSeconds: 3600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "system.attributes.senses.ranges.truesight"),
        ],
      },
    ];
  }

}
