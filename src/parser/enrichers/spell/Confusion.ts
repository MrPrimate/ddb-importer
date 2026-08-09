import DDBEnricherData from "../data/DDBEnricherData";

export default class Confusion extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
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

  override get itemMacro(): IDDBItemMacro {
    return {
      name: "confusion.js",
      type: "spell",
    };
  }
}
