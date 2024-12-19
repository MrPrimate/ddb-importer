/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class GhostWalk extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Spectral Form",
        options: {
          durationSeconds: 600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 2, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.overrideChange("true", 2, "system.attributes.movement.hover"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.disadvantage.attack.all"),")
        ]
      },
    ];
  }

  get useDefaultAdditionalActivities() {
    return true;
  }

}
