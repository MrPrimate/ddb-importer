import DDBEnricherData from "../data/DDBEnricherData";

export default class PhantomSteed extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getPhantomSteed;
  }

  override get generateSummons() {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      noTemplate: true,
      profileKeys: this.is2014
        ? [
          { count: 1, name: "PhantomSteed2014" },
        ]
        : [
          { count: 1, name: "PhantomSteed2024" },
        ],
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
