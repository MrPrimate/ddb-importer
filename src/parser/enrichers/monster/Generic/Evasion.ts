import DDBEnricherData from "../../data/DDBEnricherData";

export default class Evasion extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.superSaver.dex"),
        ],
      },
    ];
  }

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

}
