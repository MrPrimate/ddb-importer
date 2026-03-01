import DDBEnricherData from "../../data/DDBEnricherData";

export default class WarBond extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Summon Weapon",
      activationType: "bonus",
      targetType: "self",
      noeffect: true,
    };
  }

  get effects() {
    return [
      {
        name: "Weapon Bond",
        type: "enchant",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Bonded]`, 20, "name"),
        ],
      },
    ];
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Bond, 1st Weapon",
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
        },
        build: {
          generateActivation: true,
          generateRange: true,
          generateConsumption: true,
          activationOverride: {
            value: "1",
            type: "hour",
          },
          rangeOverride: {
            units: "self",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: 1,
                scaling: { mode: "", formula: "" },
              },
            ],
          },
          data: {
            restrictions: {
              type: "weapon",
              allowMagical: true,
            },
          },
        },
      },
      {
        init: {
          name: "Bond, 2nd Weapon",
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
        },
        build: {
          generateActivation: true,
          generateRange: true,
          generateConsumption: true,
          activationOverride: {
            value: "1",
            type: "hour",
          },
          rangeOverride: {
            units: "self",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: 1,
                scaling: { mode: "", formula: "" },
              },
            ],
          },
          data: {
            restrictions: {
              type: "weapon",
              allowMagical: true,
            },
          },
        },
      },
    ];
  }

  get override() {
    return {
      uses: {
        spent: null,
        max: "2",
      },
      retainUseSpent: true,
    };
  }

}
