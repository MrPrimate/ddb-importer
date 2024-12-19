/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class FightingStyleInterception extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "creature",
      data: {
        target: {
          "affects.type": "creature",
          template: {},
        },
        roll: {
          prompt: false,
          visible: false,
          formula: "1d10 + @prof",
          name: "Reduce Damage Roll",
        },
      },
    };
  }

  get effects() {
    return [
      {
        midiOnly: true,
        name: "Interception: Automation",
        options: {
          transfer: true,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("1d10 + @system.attributes.prof", 20, "flags.midi-qol.DR.mwak"),
          DDBEnricherData.ChangeHelper.overrideChange("1d10 + @system.attributes.prof", 20, "flags.midi-qol.DR.rwak"),
          DDBEnricherData.ChangeHelper.overrideChange("1d10 + @system.attributes.prof", 20, "flags.midi-qol.DR.rsak"),
          DDBEnricherData.ChangeHelper.overrideChange("1d10 + @system.attributes.prof", 20, "flags.midi-qol.DR.msak"),
        ],
        daeSpecialDurations: ["isDamaged"],
      },
    ];
  }
}
