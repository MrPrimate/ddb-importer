import DDBEnricherData from "../../data/DDBEnricherData";

export default class ElderChampion extends DDBEnricherData {

  get activity() {
    return {
      name: "Activate Elder Champion",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      addItemConsume: true,
      activationType: "bonus",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Regain HP",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateHealing: true,
          healingPart: DDBEnricherData.basicDamagePart({ bonus: "10", type: "healing" }),
        },
        overrides: {
          targetType: "self",
          activationType: "turnStart",
          activationCondition: "Start of your turn",
        },
      },
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

  get override() {
    const uses = this._getUsesWithSpent({ type: "class", name: "Imbue Aura of Protection", max: "1", period: "lr" });
    return {
      uses,
    };
  }

  get effects() {
    return [{
      name: "Diminish Defiance",
      options: {
        description: "Enemies in the aura have Disadvantage on saving throws against your spells and Channel Divinity options.",
      },
      activitiesMatch: ["Activate Elder Champion"],
    }];
  }

}
