import DDBEnricherData from "../data/DDBEnricherData";

export default class FlameTongue extends DDBEnricherData {

  get activity() {
    return {
      additionalDamageIncludeBase: true,
    };
  }

  get effects() {
    return [
      {
        name: "Weapon Aflame",
      },
    ];
  }

}
