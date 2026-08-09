import DDBEnricherData from "../../data/DDBEnricherData";

export default class RelentlessAvenger extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Reduce Speed",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      targetType: "creature",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      name: "Relentless Avenger: Speed Reduction",
      options: {
        durationSeconds: 6,
      },
      changes: [
        DDBEnricherData.ChangeHelper.overrideChange("0", 90, "system.attributes.movement.walk"),
      ],
    }];
  }


}
