/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class MetamagicGeneric extends DDBEnricherData {

  get type() {
    return "utility";
  }

}
