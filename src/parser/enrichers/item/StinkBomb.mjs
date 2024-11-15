/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class StinkBomb extends DDBEnricherData {

  get activity() {
    return {
      targetType: "creature",
    };
  }

}
