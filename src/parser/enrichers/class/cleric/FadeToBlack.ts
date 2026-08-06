import DDBEnricherData from "../../data/DDBEnricherData";

export default class FadeToBlack extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Fade to Black: Invisible",
        statuses: ["Invisible"],
        options: {
          durationSeconds: 60,
          description: "Invisible for 1 minute. Ends early if you attack or cast a spell.",
        },
      },
    ];
  }

}
