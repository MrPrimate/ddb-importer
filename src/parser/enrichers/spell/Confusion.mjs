/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Confusion extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Confused",
        macroChanges: [
          { macroType: "spell", macroName: "confusion.js" },
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange(
            `label=${this.data.name} (End of Turn),turn=end,saveAbility=wis,saveDC=@attributes.spell.dc,saveMagic=true,killAnim=true`,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
        data: {
          flags: {
            dae: {
              macroRepeat: "startEveryTurn",
            },
          },
        },
      },
    ];
  }

  get itemMacro() {
    return {
      name: "confusion.js",
      type: "spell",
    };
  }
}
