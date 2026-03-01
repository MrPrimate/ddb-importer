import DDBEnricherData from "../data/DDBEnricherData";

export default class GuardianOfFaith extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getGuardianOfFaith;
  }

  get generateSummons() {
    return true;
  }

  get activity() {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      noTemplate: true,
      profileKeys: this.is2014
        ? [{ count: 1, name: "GuardianOfFaith2014" }]
        : [{ count: 1, name: "GuardianOfFaith2024" }],
      summons: {
        match: {
          saves: true,
        },
      },
    };
  }

  get override() {
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
