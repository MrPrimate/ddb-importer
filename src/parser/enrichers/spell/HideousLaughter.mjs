/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class HideousLaughter extends DDBEnricherData {

  get clearAutoEffects() {
    return true;
  }

  get effects() {
    return [
      {
        name: "Laughing Uncontrollably",
        statuses: ["Prone", "Incapacitated"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange(
            `label=${this.data.name} (End of Turn),turn=end,saveDC=@attributes.spelldc,saveAbility=wis,saveMagic=true,killAnim=true`,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
        macroChanges: [
          { macroType: "spell", macroName: "hideousLaughter.js" },
        ],
      },
    ];
  }

  get itemMacro() {
    return {
      macroType: "spell",
      macroName: "hideousLaughter.js",
    };
  }

}
