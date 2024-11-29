/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class UncannyMetabolism extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      itemConsumeValue: "-@scale.monk.focus-points",
      additionalConsumptionTargets: [
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
        "flags.ddbimporter": {
          retainChildUses: true,
        },
      },
    };
  }

}
