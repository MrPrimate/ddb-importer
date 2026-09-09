import DDBEnricherData from "../../data/DDBEnricherData";

export default class FadeToBlack extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
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
