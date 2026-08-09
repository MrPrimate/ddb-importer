import DDBEnricherData from "../data/DDBEnricherData";

export default class ConjureFey extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    if (this.is2014) return null;
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return DDBImporter.lib.DDBSummonsInterface.getConjureFey2024;
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
        { count: 1, name: "ConjureFey" },
      ],
      summons: {
        "match": {
          "proficiency": false,
          "attacks": true,
          "saves": false,
        },
        "bonuses": {
          "ac": "",
          "hp": "",
          "attackDamage": "(@item.level - 6)d12 + @mod",
          "saveDamage": "",
          "healing": "",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Summons: Teleport and Attack",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
        overrides: {
          targetType: "ally",
          activationType: "special",
          noTemplate: true,
          data: {
            range: {
              units: "ft",
              value: "30",
            },
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
