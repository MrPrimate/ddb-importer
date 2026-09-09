import DDBEnricherData from "../../data/DDBEnricherData";

export default class SculptSpells extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        name: "Sculpt Spells (Automation)",
        options: {
          transfer: true,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.sculptSpell"),
        ],
      },
    ];
  }

}
