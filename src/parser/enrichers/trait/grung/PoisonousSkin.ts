import DDBEnricherData from "../../data/DDBEnricherData";

export default class PoisonousSkin extends DDBEnricherData {

  override get useDefaultAdditionalActivities() {
    return true;
  }

  override get clearAutoEffects() {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poisoned",
        statuses: ["Poisoned"],
        options: {
          durationSeconds: 60,
        },
      },
    ];
  }

}
