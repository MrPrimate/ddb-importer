import DDBEnricherData from "../data/DDBEnricherData";

export default class DragonWing extends DDBEnricherData {

  override get combineGrantedDamageModifiers() {
    return true;
  }

}
