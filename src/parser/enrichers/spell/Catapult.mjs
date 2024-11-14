/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class Catapult extends DDBEnricherMixin {

  get override() {
    return {
      data: {
        "flags.midiProperties.nodam": true,
      },
    };
  }

}
