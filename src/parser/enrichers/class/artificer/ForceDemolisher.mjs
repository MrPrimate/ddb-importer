/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ForceDemolisher extends DDBEnricherData {
  get type() {
    return "attack";
  }
}
