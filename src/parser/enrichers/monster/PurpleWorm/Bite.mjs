/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Bite extends DDBEnricherData {

  get type() {
    return "attack";
  }

  get activity() {
    return {
      name: "Bite",
      activationType: "action",
    };
  }

  get effects() {
    return [
      {
        name: "Purple Worm: Swallowed",
        activityMatch: "Bite",
        statuses: ["Blinded", "Restrained"],
      },
    ];
  }

  rename({ enricher } = {}) {
    enricher.data.system.activities.damageDamageIIII.name = "Swallowed Damage";
  }

  get override() {
    return {
      func: this.rename,
    };
  }

}
