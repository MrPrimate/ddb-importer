/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class SorceryIncarnate extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Restore Innate Sorcery Use",
      noConsumeTargets: true,
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "Font of Magic: Sorcery Points",
          value: "2",
          scaling: {
            mode: "",
            formula: "",
          },
        },
        {
          type: "itemUses",
          target: "Innate Sorcery",
          value: "-1",
          scaling: {
            mode: "",
            formula: "",
          },
        },
      ],
    };
  }

  get override() {
    return {
      replaceActivityUses: true,
    };
  }

}
