/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class SuperiorCritical extends DDBEnricherMixin {

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherMixin.generateDowngradeChange("19", 25, "flags.dnd5e.weaponCriticalThreshold"),
        ],
      },
    ];
  }

}
