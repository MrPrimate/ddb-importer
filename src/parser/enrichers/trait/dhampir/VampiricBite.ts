import DDBEnricherData from "../../data/DDBEnricherData";

export default class VampiricBite extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

}
