/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class SorcerousRestoration extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      noConsumeTargets: true,
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "",
          value: "-(floor(@classes.sorcerer.levels / 2))",
          scaling: {
            mode: "",
            formula: "",
          },
        },
        {
          type: "itemUses",
          target: "",
          value: "1",
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
      data: {
        "flags.ddbimporter.retainChildUses": true,
      },
    };
  }

}
