import Generic from "../Generic";

export default class BeguilingTwist extends Generic {

  get clearAutoEffects() {
    // Preserve the effect cloned from the same-named action on the feature;
    // clearing here runs after activity cloning and leaves dangling links.
    return this.isAction;
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Charmed",
        options: {
          durationSeconds: 60,
        },
        statuses: ["Charmed"],
      },
      {
        name: "Frightened",
        options: {
          durationSeconds: 60,
        },
        statuses: ["Frightened"],
      },
    ];
  }

}
