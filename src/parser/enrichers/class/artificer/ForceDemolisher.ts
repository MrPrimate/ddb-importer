import DDBEnricherData from "../../data/DDBEnricherData";

export default class ForceDemolisher extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }
}
