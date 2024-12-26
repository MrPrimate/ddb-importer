/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Entangle extends DDBEnricherData {

  get effects() {
    return [
      {
        noCreate: true,
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "You can take an action to break free by rolling a Strength Ability Check",
            20,
            "flags.midi-qol.OverTime",
          ),
          DDBEnricherData.ChangeHelper.customChange(
            `turn=end, rollType=check, actionSave=true, saveAbility=str, saveDC=@attributes.spelldc, label=Restrained by ${this.data.name}`,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
