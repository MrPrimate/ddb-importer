import DDBEnricherData from "../../data/DDBEnricherData";

export default class Permafrost extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Extend Rage",
      targetType: "self",
      activationType: "special",
      activationCondition: "Your Rage would end while you don't have the Unconscious condition",
      addItemConsume: true,
      data: {
        range: {
          units: "self",
        },
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      uses: {
        max: "max(1, @abilities.con.mod)",
        recovery: [{ period: "lr", type: "recoverAll", formula: "" }],
      },
    };
  }

}
