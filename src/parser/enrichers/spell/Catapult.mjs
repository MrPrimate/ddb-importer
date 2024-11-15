/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Catapult extends DDBEnricherData {

  get override() {
    return {
      data: {
        "flags.midiProperties.nodam": true,
      },
    };
  }

}
