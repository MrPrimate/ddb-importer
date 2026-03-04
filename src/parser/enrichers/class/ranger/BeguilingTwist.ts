import Generic from "../Generic";

export default class BeguilingTwist extends Generic {

  get clearAutoEffects() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
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
