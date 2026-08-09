import DDBEnricherData from "../data/DDBEnricherData";

export default class HideousLaughter extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Laughing Uncontrollably",
        statuses: ["Prone", "Incapacitated"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange(
            `label=${this.data.name} (End of Turn),turn=end,saveDC=@attributes.spell.dc,saveAbility=wis,saveMagic=true,killAnim=true`,
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

  override get itemMacro(): IDDBItemMacro {
    return {
      macroType: "spell",
      macroName: "hideousLaughter.js",
    };
  }

}
