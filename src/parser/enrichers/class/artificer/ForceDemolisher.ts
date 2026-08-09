import DDBEnricherData from "../../data/DDBEnricherData";

export default class ForceDemolisher extends DDBEnricherData {
  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }
}
