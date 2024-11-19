/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

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
