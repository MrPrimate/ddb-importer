import DDBEnricherData from "../data/DDBEnricherData";

export default class Blur extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Blur",
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.grants.disadvantage.attack.all"),
        ],
        tokenMagicChanges: [
          DDBEnricherData.ChangeHelper.tokenMagicFXChange("blur"),
        ],
      },
    ];
  }

}
