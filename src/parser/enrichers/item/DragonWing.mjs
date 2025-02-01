/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class DragonWing extends DDBEnricherData {

  get combineGrantedDamageModifiers() {
    return true;
  }

}
