/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SculptSpells extends DDBEnricherData {

  get effects() {
    return [
      {
        midiOnly: true,
        name: "Sculpt Spells (Automation)",
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.sculptSpell"),
        ],
      },
    ];
  }

}
