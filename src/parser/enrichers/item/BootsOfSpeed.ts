import DDBEnricherData from "../data/DDBEnricherData";

export default class BootsOfSpeed extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "bonus",
      targetType: "self",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: false,
          durationSeconds: 600,
          durationRounds: 100,
        },
        data: {
          system: {
            changes: [
              DDBEnricherData.ChangeHelper.multiplyChange(2, 20, "system.attributes.movement.speeds.walk"),
            ],
          },
        },
      },
    ];
  }

}
