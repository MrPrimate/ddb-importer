import DDBEnricherData from "../../data/DDBEnricherData";

export default class ShapeShift extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      data: {
        duration: {
          units: "perm",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Shape Shifted",
        changes: [
          DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("cha"),
        ],
      },
    ];
  }

}
