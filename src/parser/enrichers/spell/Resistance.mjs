/* eslint-disable class-methods-use-this */
import { utils } from "../../../lib/_module.mjs";
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Resistance extends DDBEnricherData {

  get activity() {
    const rollName = this.is2014 ? "Save Bonus" : "Damage Reduction";
    return {
      name: "Cast",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1d4",
          name: rollName,
        },
      },
    };
  }

  get effects() {
    if (this.is2014) {
      return [
        {
          name: "Resistance",
          midiOptionalChanges: [
            {
              name: "resistance",
              data: {
                label: "Use Resistance?",
                "save.all": "+ 1d4",
              },
            },
          ],
          daeDurationSeconds: ["isSave"],
        },
      ];
    }
    return DDBEnricherData.allDamageTypes(["force"]).map((element) => {
      return {
        name: `Resistance: ${utils.capitalize(element)}`,
        options: {
          durationSeconds: 60,
        },
      };
    });
  }
}
