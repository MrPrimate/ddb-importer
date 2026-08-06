import DDBEnricherData from "../../data/DDBEnricherData";

export default class WeatherTheStorm extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Weather the Storm",
        options: {
          durationSeconds: 60,
          description: "At the end of each of your turns, you gain Temporary Hit Points equal to your Fighter level plus your Constitution modifier.",
        },
      },
    ];
  }

}
