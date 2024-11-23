/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class FeatherFall extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get override() {
    return {
      midiManualReaction: true,
    };
  }

}
