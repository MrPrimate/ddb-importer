/* eslint-disable class-methods-use-this */
// import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Taunt extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Taunted",
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.disadvantage.all"),
        ],
        options: {
          durationSeconds: 12,
          durationRounds: 2,
          transfer: false,
          showIcon: true,
        },
        daeSpecialDurations: ["turnStart", "combatEnd"],
      },
    ];
  }

}
