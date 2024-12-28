/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ActionSurge extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Action Surge",
      activationType: "special",
      targetType: "self",
    };
  }

  get override() {
    return {
      removeDamage: true,
    };
  }

}
