/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Haste extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.generateSignedAddChange("2", 20, "system.attributes.ac.bonus"),
        ],
        midiChanges: [
          DDBEnricherData.generateOverrideChange("1", 20, "flags.midi-qol.advantage.ability.save.dex"),
          DDBEnricherData.generateCustomChange("*2", 30, "system.attributes.movement.all"),
        ],
      },
    ];
  }

}
