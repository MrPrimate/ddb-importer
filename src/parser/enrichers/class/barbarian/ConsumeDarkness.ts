import DDBEnricherData from "../../data/DDBEnricherData";

export default class ConsumeDarkness extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      activationCondition: "While raging in Dim Light or Darkness",
      addItemConsume: true,
      data: {
        range: {
          units: "self",
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "1d12 + @abilities.con.mod",
          types: ["healing"],
        }),
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      uses: {
        max: "1",
        recovery: [{ period: "sr", type: "recoverAll", formula: "" }],
      },
    };
  }

}
