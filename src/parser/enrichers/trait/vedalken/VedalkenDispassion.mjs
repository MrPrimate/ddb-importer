/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class VedalkenDispassion extends DDBEnricherData {

  get effects() {
    return [
      {
        midiOnly: true,
        options: {
          transfer: false,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.advantage.ability.save.cha"),
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.advantage.ability.save.wis"),
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.advantage.ability.save.int"),
        ],
      },
    ];
  }

}
