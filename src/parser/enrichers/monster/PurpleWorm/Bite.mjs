/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Bite extends DDBEnricherData {

  get type() {
    return "attack";
  }

  get activity() {
    return {
      name: this.is2014
        ? this.ddbEnricher?._originalActivity?.type === "damage"
          ? "Swallowed Damage"
          : "Bite"
        : this.ddbEnricher?._originalActivity?.type === "check"
          ? "Escape Check"
          : "Bite",
      activationType: this.is2014
        ? this.ddbEnricher?._originalActivity?.type === "damage"
          ? "special"
          : "action"
        : this.ddbEnricher?._originalActivity?.type === "check"
          ? "special"
          : "action",
    };
  }

  get effects() {
    return this.is2014
      ? [
        {
          name: "Purple Worm: Swallowed",
          activityMatch: "Bite",
          statuses: ["Blinded", "Restrained"],
        },
      ]
      : [];
  }

  // rename({ enricher } = {}) {
  //   if (this.is2014) enricher.data.system.activities.damageDamageIIII.name = "Swallowed Damage";
  // }

  // get override() {
  //   return {
  //     func: this.rename,
  //   };
  // }

}
