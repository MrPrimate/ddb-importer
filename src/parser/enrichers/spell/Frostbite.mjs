/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Frostbite extends DDBEnricherData {

  get effects() {
    return [
      {
        noCreate: true,
        name: `Frostbitten`,
        options: {
          durationRounds: 2,
          description: "The target has disadvantage on the next weapon attack roll it makes before the end of its next turn.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.mwak"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.rwak"),
        ],
        daeSpecialDurations: ["1Attack:rwak", "1Attack:mwak", "turnEnd"],
      },
    ];
  }

}
