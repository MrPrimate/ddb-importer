/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class SupremeSneak extends DDBEnricherMixin {
  get type() {
    return "none";
  }

  get additionalActivities() {
    return [
      { action: { name: "Sneak Attack: Supreme Sneak (Cost: 1d6)", type: "class" } },
    ];
  }

}
