/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class Alert extends DDBEnricherMixin {

  get effects() {
    const changes = this.is2014
      ? [DDBEnricherMixin.generateOverrideChange("true", 20, "flags.dnd5e.initiativeAlert")]
      : [DDBEnricherMixin.generateUnsignedAddChange("@prof", 20, "system.attributes.init.bonus")];
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
