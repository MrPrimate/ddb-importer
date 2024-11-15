/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Alert extends DDBEnricherData {

  get effects() {
    const changes = this.is2014
      ? [DDBEnricherData.generateOverrideChange("true", 20, "flags.dnd5e.initiativeAlert")]
      : [DDBEnricherData.generateUnsignedAddChange("@prof", 20, "system.attributes.init.bonus")];
    return [
      {
        options: {
          transfer: true,
        },
        changes,
      },
    ];

  }

}
