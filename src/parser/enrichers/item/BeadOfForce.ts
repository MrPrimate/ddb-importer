import DDBEnricherData from "../data/DDBEnricherData";

export default class BeadOfForce extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      addItemConsume: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: false,
          description: "Trapped in a sphere of force!",
          durationRounds: 10,
          durationSeconds: 60,
        },
      },
    ];
  }

}
