import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

export default class ShadowShroud extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Shadow Shroud",
      ..._Illrigger.sealConsume(),
      activationType: "bonus",
      targetType: "creature",
      targetCount: 1,
      data: {
        range: {
          units: "touch",
          value: "",
        },
        duration: {
          units: "minute",
          value: "1",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Shadow Shroud",
        activityMatch: "Shadow Shroud",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("2", 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }

}
