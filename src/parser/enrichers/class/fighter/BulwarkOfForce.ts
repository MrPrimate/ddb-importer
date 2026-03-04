import Generic from "../Generic";

export default class BulwarkOfForce extends Generic {


  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Psychic Cover",
        statuses: ["coverHalf"],
        options: {
          durationSeconds: 60,
        },
      },
    ];
  }


}
