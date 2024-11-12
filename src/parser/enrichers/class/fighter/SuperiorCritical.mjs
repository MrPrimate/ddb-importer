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
          DDBEnricherMixin.generateDowngradeChange("18", 30, "flags.dnd5e.weaponCriticalThreshold"),
        ],
      },
    ];
  }

}
