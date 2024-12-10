/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class SpellguardShield extends DDBEnricherData {

  get effects() {
    return [
      {
        noCreate: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.generateCustomChange(1, 20, "flags.midi-qol.grants.disadvantage.attack.msak"),
          DDBEnricherData.ChangeHelper.generateCustomChange(1, 20, "flags.midi-qol.grants.disadvantage.attack.rsak"),
        ],
      },
    ];
  }
}
