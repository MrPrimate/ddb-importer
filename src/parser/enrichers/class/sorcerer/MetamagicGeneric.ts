import DDBEnricherData from "../../data/DDBEnricherData";

export default class MetamagicGeneric extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

}
