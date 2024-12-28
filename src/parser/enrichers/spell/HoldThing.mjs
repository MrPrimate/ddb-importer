/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class HoldThing extends DDBEnricherData {

  get effects() {
    return [
      {
        noCreate: true,
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            `label=${this.data.name} (End of Turn),turn=end,saveDC=@attributes.spelldc,saveAbility=wis,savingThrow=true,saveMagic=true,killAnim=true`,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
