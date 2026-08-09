import DDBEnricherData from "../data/DDBEnricherData";

export default class FaithfulHound extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return DDBImporter.lib.DDBSummonsInterface.getFaithfulHound;
  }

  override get generateSummons(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      noTemplate: true,
      profileKeys: this.is2014
        ? [
          { count: 1, name: "FaithfulHound2014" },
        ]
        : [
          { count: 1, name: "FaithfulHound2024" },
        ],
      summons: {
        "match": {
          "proficiency": this.is2014,
          "attacks": this.is2014,
          "saves": !this.is2014,
        },
      },

    };
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
