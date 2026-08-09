import DDBEnricherData from "../data/DDBEnricherData";

export default class FlameTongue extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      additionalDamageIncludeBase: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Weapon Aflame",
      },
    ];
  }

}
