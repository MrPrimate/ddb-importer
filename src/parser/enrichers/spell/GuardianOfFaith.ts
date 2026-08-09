import DDBEnricherData from "../data/DDBEnricherData";

export default class GuardianOfFaith extends DDBEnricherData {
  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getGuardianOfFaith;
  }

  override get generateSummons() {
    return true;
  }

  override get activity(): IDDBActivityData {
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
