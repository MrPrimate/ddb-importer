import DDBEnricherData from "../../data/DDBEnricherData";

export default class StrengthOfTheGrave extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      noConsumeTargets: true,
      targetType: "self",
      noeffect: true,
      activationType: "special",
      addScalingMode: "amount",
      addScalingFormula: "1",
      data: {
        consumption: {
          "targets": [],
          "scaling": {
            "allowed": true,
            "max": "",
          },
          "spellSlot": true,
        },
        save: {
          ability: ["cha"],
          dc: {
            calculation: "",
            formula: "5 + @scaling",
          },
        },
      },
    };
  }

}
