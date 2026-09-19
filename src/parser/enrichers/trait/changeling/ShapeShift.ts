import DDBEnricherData from "../../data/DDBEnricherData";

export default class ShapeShift extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.TRANSFORM;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Change Form",
      targetType: "self",
      activationType: "action",
      data: {
        duration: {
          units: "inst",
        },
        ...DDBEnricherData.formTransformData({ formless: true }),
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Shape Shifted",
        activityMatch: "Change Form",
        // the shape lasts until the changeling reverts, which is the transform's "No Form" choice
        options: {
          transfer: false,
          durationSeconds: null,
        },
        changes: [
          DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("cha"),
        ],
      },
    ];
  }

}
