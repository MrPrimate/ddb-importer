import DDBEnricherData from "../data/DDBEnricherData";

export default class FlameTongue extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      additionalDamageIncludeBase: true,
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Weapon Aflame",
      },
    ];
  }

}
