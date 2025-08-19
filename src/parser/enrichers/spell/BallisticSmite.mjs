/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class BallisticSmite extends DDBEnricherData {

  get combineDamageTypes() {
    return true;
  }

}
