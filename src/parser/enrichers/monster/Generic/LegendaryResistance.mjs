/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class LegendaryResistance extends DDBEnricherData {

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        name: "Legendary Resistance",
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("success", 20, "flags.midi-qol.optional.LegRes.save.fail.all"),
          DDBEnricherData.ChangeHelper.customChange("@resources.legres.value", 20, "flags.midi-qol.optional.LegRes.count"),
          DDBEnricherData.ChangeHelper.customChange("Use Legendary Resistance to Succeed?", 20, "flags.midi-qol.optional.LegRes.label"),
        ],
      },
    ];
  }

}
