import ArcaneShotOption from "./ArcaneShotOption";

export default class ShadowArrow extends ArcaneShotOption {

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Covered on Shadow",
        options: {
          durationSeconds: 12,
        },
        daeSpecialDurations: ["turnEnd" as const],
      },
    ];
  }

}
