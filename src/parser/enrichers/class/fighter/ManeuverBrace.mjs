/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ManeuverBrace extends DDBEnricherData {

  get override() {
    return {
      midiManualReaction: true,
    };
  }

}
