import DDBEnricherData from "../data/DDBEnricherData";

export default class UnseenServant extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getUnseenServant;
  }

  get generateSummons() {
    return true;
  }

  get activity(): IDDBActivityData {
    return {
      noTemplate: true,
      profileKeys: [
        { count: 1, name: "UnseenServantSRD" },
      ],
      summons: {
      },
    };
  }

}
