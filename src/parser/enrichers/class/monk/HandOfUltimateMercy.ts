import DDBEnricherData from "../../data/DDBEnricherData";

export default class HandOfUltimateMercy extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  /**
   * @returns {DDBActivityData | null}
   */
  get activity(): IDDBActivityData {
    return {
      name: "Hand of Ultimate Mercy",
      activationType: "special",
      targetType: "creature",
      addItemConsume: true,
      itemConsumeTargetName: this.ddbEnricher.isParentClass2014 ? "Ki" : "Monk's Focus",
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
  get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
      data: {
        flags: {
          ddbimporter: {
            skipScale: true,
          },
        },
      },
    };
  }

}
