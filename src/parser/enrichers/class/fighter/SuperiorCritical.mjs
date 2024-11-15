/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SuperiorCritical extends DDBEnricherData {

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.generateDowngradeChange("18", 30, "flags.dnd5e.weaponCriticalThreshold"),
        ],
      },
    ];
  }

}
