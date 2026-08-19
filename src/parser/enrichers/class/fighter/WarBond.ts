import DDBEnricherData from "../../data/DDBEnricherData";

export default class WarBond extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Summon Weapon",
      activationType: "bonus",
      targetType: "self",
      noeffect: true,
      noConsumeTargets: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
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

  override get additionalActivities(): IDDBAdditionalActivity[] {
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
            value: 1,
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
            value: 1,
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

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "2",
      },
      retainUseSpent: true,
    };
  }

}
