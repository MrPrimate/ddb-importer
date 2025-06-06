/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Haste extends DDBEnricherData {

  get effects() {
    return [
      {
        data: {
          duration: {
            seconds: 60,
          },
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.customChange("*2", 30, "system.attributes.movement.all"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "flags.midi-qol.advantage.ability.save.dex"),
        ],
      },
    ];
  }

}
