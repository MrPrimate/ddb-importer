import DDBEnricherData from "../../data/DDBEnricherData";

export default class PlayDead extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    // the same-named DDB action also loads this enricher and its effect is
    // cloned onto the trait with the activity - skip the trait-side copy
    if (!this.isAction) return [];
    return [
      {
        name: "Playing Dead",
        activityMatch: "Play Dead",
        options: {
          durationSeconds: 3600,
          description: "Creatures that look at you see only a corpse. An adjacent creature can use its action on an Intelligence (Investigation) check contested by your Constitution (Deception) to see through the trick. Ends early if you take a Bonus Action to end it.",
        },
      },
    ];
  }

}
