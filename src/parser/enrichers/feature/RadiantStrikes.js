/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class RadiantStrikes extends DDBEnricherMixin {

  get activity() {
    return {
      type: "none",
    };
  }

  get effect() {
    return {
      options: {
        transfer: true,
      },
      changes: [
        DDBEnricherMixin.generateUnsignedAddChange("1d8[radiant]", 20, "system.bonuses.mwak.damage"),
      ],
    };
  }

}
