/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../mixins/DDBEnricherData.mjs";

export default class Darkvision extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.generateUpgradeChange("60", 20, "system.attributes.senses.darkvision"),
        ],
        atlChanges: [
          DDBEnricherData.generateATLChange("ATL.sight.range", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 60, 5),
          DDBEnricherData.generateATLChange("ATL.sight.visionMode", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "darkvision", 5),
        ],
      },
    ];
  }

}
