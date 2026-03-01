import DDBEnricherData from "../../data/DDBEnricherData";

export default class EmbodyLegends extends DDBEnricherData {

  get activity() {
    return {
      name: "Reroll Saving Throw",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      targetType: "self",
      activationType: "reaction",
      noConsumeTargets: true,
    };
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Spend Spell Slot to Restore Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "none",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "spellSlots",
                value: "1",
                target: "5",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

}
