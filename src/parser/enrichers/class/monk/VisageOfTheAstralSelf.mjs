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
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.skill.itm"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.skill.ins"),
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
