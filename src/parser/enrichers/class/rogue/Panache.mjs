/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Panache extends DDBEnricherData {

  get type() {
    return "check";
  }

  get activity() {
    return {
      data: {
        check: {
          associated: ["per"],
          ability: "",
          dc: {
            calculation: "",
            formula: "",
          },
        },
      },
    };
  }

  get effects() {
    return [
      {
        name: "Taunted",
        options: {
          durationSeconds: 60,
          description: `Disadvantage on attack rolls against targets other than you until the start of your next turn`,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("!workflow.target.getName('@token.name')", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        daeSpecialDurations: ["turnStartSource"],
        data: {
          duration: {
            seconds: 60,
          },
        },
      },
    ];
  }

}
