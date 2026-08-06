import DDBEnricherData from "../../data/DDBEnricherData";

export default class TouchOfSorrow extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get clearAutoEffects() {
    return this.isAction;
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Touch of Sorrow",
        statuses: ["Paralyzed", "Poisoned"],
        options: {
          durationSeconds: 86400,
          description: "Paralyzed and Poisoned for 24 hours. The Paralyzed condition ends early if the creature takes damage or is no longer Poisoned.",
        },
      },
    ];
  }

}
