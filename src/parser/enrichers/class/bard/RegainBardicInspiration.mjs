/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class RegainBardicInspiration extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
    return {
      addItemConsume: true,
      itemConsumeValue: "-1",
      activationType: "special",
      addConsumptionScalingMax: "9",
      additionalConsumptionTargets: [
        {
          type: "spellSlots",
          value: "1",
          target: "1",
          scaling: {
            mode: "level",
          },
        },
      ],
      data: {
        name: "Regain via Spell Slot",
      },
    };
  }
}
