import DDBEnricherData from "../data/DDBEnricherData";

export default class BootsOfSpeed extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      activationType: "bonus",
      targetType: "self",
    };
  }

  get effects(): IDDBEffectHint[] {
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
              DDBEnricherData.ChangeHelper.multiplyChange(2, 20, "system.attributes.movement.walk"),
            ],
          },
        },
      },
    ];
  }

}
