import DDBEnricherData from "../data/DDBEnricherData";

export default class ConjureAnimals extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    if (this.is2014) return null;
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return DDBImporter.lib.DDBSummonsInterface.getConjureAnimals2024;
  }

  override get generateSummons(): boolean {
    return !this.is2014;
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) return null;
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      noTemplate: true,
      profileKeys: [
        { count: 1, name: "ConjureAnimals" },
      ],
      summons: {
        "match": {
          "proficiency": false,
          "attacks": false,
          "saves": true,
        },
        "bonuses": {
          "ac": "",
          "hp": "",
          "attackDamage": "",
          "saveDamage": "(@item.level - 3)d10",
          "healing": "",
        },
      },
    };
  }

  // the pack's own attack: a Dexterity save against any creature it moves within 10 feet of, once per turn
  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) return [];
    return [
      {
        init: {
          name: "Pack Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          noSpellslot: true,
          generateDamage: true,
          generateSave: true,
          noeffect: true,
          saveOverride: {
            ability: ["dex"],
            dc: {
              formula: "",
              calculation: "spellcasting",
            },
          },
          onSave: "none",
          damageParts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 10, type: "slashing", scalingMode: "whole", scalingNumber: 1 })],
          activationOverride: {
            type: "special",
            value: null,
            condition: "A creature within 10 feet of the pack",
          },
          targetOverride: {
            override: true,
            affects: {
              count: "1",
              type: "creature",
            },
            template: {},
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        flags: {
          ddbimporter: {
            disposition: {
              match: true,
            },
          },
        },
      },
    };
  }
}
