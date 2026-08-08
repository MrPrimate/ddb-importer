import DDBEnricherData from "../../data/DDBEnricherData";

export default class ShapeShift extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      data: {
        duration: {
          units: "perm",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
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
