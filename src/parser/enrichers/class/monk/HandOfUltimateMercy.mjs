/* eslint-disable jsdoc/require-description */
/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class HandOfUltimateMercy extends DDBEnricherData {

  get type() {
    return "heal";
  }

  /**
   * @returns {DDBActivityData | null}
   */
  get activity() {
    return {
      name: "Hand of Ultimate Mercy",
      activationType: "special",
      targetType: "creature",
      addItemConsume: true,
      itemConsumeTargetName: this.is2014 ? "Ki" : "Monk's Focus",
      itemConsumeValue: 5,
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
      data: {
        "range.units": "touch",
        healing: DDBEnricherData.basicDamagePart({
          number: 4,
          denomination: 10,
          customFormula: "@abilities.wis.mod",
          type: "healing",
        }),
      },
    };
  }

  /**
   * @returns {DDBOverrideData | null}
   */
  get override() {
    return {
      data: {
        "flags.ddbimporter.skipScale": true,
      },
    };
  }

}
