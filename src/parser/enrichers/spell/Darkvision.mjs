/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Darkvision extends DDBEnricherData {

  get effects() {
    const value = this.is2014 ? 60 : 150;
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange(`${value}`, 20, "system.attributes.senses.darkvision"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.range", CONST.ACTIVE_EFFECT_MODES.UPGRADE, value, 5),
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.visionMode", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "darkvision", 5),
        ],
      },
    ];
  }

}
