/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../mixins/DDBEnricherData.mjs";

export default class Feeblemind extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.generateOverrideChange("1", 20, "system.abilities.cha.value"),
          DDBEnricherData.generateOverrideChange("1", 20, "system.abilities.int.value"),
        ],
        midiChanges: [
          DDBEnricherData.generateOverrideChange("1", 20, "flags.midi-qol.fail.spell.all"),
        ],
      },
    ];
  }

}
