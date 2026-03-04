import DDBEnricherData from "../data/DDBEnricherData";

export default class Feeblemind extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "system.abilities.cha.value"),
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "system.abilities.int.value"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "flags.midi-qol.fail.spell.all"),
        ],
      },
    ];
  }

}
