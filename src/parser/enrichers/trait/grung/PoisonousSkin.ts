import DDBEnricherData from "../../data/DDBEnricherData";

export default class PoisonousSkin extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get clearAutoEffects() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
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
