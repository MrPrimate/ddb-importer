import DDBEnricherData from "../../data/DDBEnricherData";

export default class StrengthOfTheGrave extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
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

  /** "After the saving throw succeeds, you can't use this feature again until you finish a long rest." */
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save Succeeded: Spend Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: false,
          generateActivation: true,
          generateTarget: true,
          noeffect: true,
          activationOverride: {
            type: "none",
            value: null,
            condition: "The Strength of the Grave save succeeded",
          },
        },
        overrides: {
          targetType: "self",
          addItemConsume: true,
        },
      },
    ];
  }

}
