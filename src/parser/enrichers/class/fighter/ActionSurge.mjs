/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ActionSurge extends DDBEnricherData {

  get override() {
    return {
      removeDamage: true,
    };
  }

}
