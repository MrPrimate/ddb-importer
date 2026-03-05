import DDBEnricherData from "../../data/DDBEnricherData";

export default class TentacleOfTheDeepsSummon extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getTentacleOfTheDeeps;
  }

  get generateSummons() {
    return true;
  }

  get activity(): IDDBActivityData {
    return {
      noTemplate: true,
      profileKeys: [
        { count: 1, name: "TentacleOfTheDeeps" },
      ],
      targetType: "self",
      activationType: "bonus",
      data: {
        duration: {
          value: "1",
          units: "minute",
        },
        creatureSizes: ["med"],
      },
    };
  }

}
