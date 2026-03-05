import { utils } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";

export default class Resistance extends DDBEnricherData {

  get activity(): IDDBActivityData {
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

  get effects(): IDDBEffectHint[] {
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
          daeSpecialDurations: ["isSave" as const],
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
