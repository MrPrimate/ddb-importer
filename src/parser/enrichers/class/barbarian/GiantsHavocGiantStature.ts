import DDBEnricherData from "../../data/DDBEnricherData";

export default class GiantsHavocGiantStature extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Giant Stature",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("lg", 20, "system.traits.size"),
        ],
      },
    ];
  }


}
