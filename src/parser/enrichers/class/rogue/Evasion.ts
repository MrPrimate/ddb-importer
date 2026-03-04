import DDBEnricherData from "../../data/DDBEnricherData";

export default class Evasion extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.superSaver.dex"),
        ],
      },
    ];
  }

  get useDefaultAdditionalActivities() {
    return true;
  }

}
