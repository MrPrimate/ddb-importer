import DDBEnricherData from "../data/DDBEnricherData";

export default class Darkvision extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    const value = this.is2014 ? 60 : 150;
    return [
      {
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.range", CONST.ACTIVE_EFFECT_MODES.UPGRADE, value, 5),
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.visionMode", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "darkvision", 5),
        ],
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange(`${value}`, 20, "system.attributes.senses.darkvision"),
        ],
      },
    ];
  }

}
