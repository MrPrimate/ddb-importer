/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Evasion extends DDBEnricherData {

  get effects() {
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
