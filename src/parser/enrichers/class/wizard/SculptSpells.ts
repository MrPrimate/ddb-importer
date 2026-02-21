import DDBEnricherData from "../../data/DDBEnricherData";

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
