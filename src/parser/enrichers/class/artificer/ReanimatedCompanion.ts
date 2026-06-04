import DDBEnricherData from "../../data/DDBEnricherData";

export default class ReanimatedCompanion extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Summon Reanimated Companion",
      targetType: "self",
      noConsumeTargets: true,
      noTemplate: true,
      data: {
        bonuses: {
          "ac": "@abilities.int.mod",
          "hp": "@classes.artificer.levels * 5",
          "attackDamage": "@abilities.int.mod",
        },
        visibility: {
          identifier: "artificer",
          level: {
            min: null,
            max: 8,
          },
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          data: {
            bonuses: {
              "ac": "@abilities.int.mod",
              "hp": "@classes.artificer.levels * 5",
              "attackDamage": "@abilities.int.mod",
              "saveDamage": "2d4",
            },
            creatureSizes: ["med", "lg"],
            visibility: {
              identifier: "artificer",
              level: {
                min: 9,
                max: null,
              },
            },
          },
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
                target: "1",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

}
