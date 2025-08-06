/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class VisageOfTheAstralSelf extends DDBEnricherData {

  get addAutoAdditionalActivities() {
    return true;
  }

  get activity() {
    return {
      targetType: "self",
      rangeSelf: true,
      data: {
        duration: {
          units: "minute",
          value: 10,
        },
      },
    };
  }

  get effects() {
    return [
      {
        options: {
          durationSeconds: 360,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("120", 20, "system.attributes.senses.truesight"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.skills.itm.roll.mode"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.skills.ins.roll.mode"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("truesight", 20, "ATL.sight.visionMode"),
          DDBEnricherData.ChangeHelper.upgradeChange("120", 20, "ATL.sight.range"),
        ],
        data: {
          flags: {
            dae: {
              selfTarget: true,
              selfTargetAlways: true,
            },
          },
        },
      },
    ];
  }

}
