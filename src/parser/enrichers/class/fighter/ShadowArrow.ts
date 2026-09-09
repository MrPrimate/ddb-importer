import ArcaneShotOption from "./ArcaneShotOption";

export default class ShadowArrow extends ArcaneShotOption {

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Covered on Shadow",
        options: {
          // "unable to see anything farther than 5 feet away until the start of your next turn"
          expiry: "sourceStart",
        },
      },
    ];
  }

}
