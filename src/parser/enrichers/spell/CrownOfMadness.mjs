/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class CrownOfMadness extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Crown of Madness (Automation)",
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Crown of Madness (End of Turn),turn=end,saveDC=@attributes.spell.dc,saveAbility=wis,saveMagic=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
