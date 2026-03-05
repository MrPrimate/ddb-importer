import DDBEnricherData from "../data/DDBEnricherData";

export default class SummonElemental extends DDBEnricherData {

  // get type() {
  //   return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  // }

  // get summonsFunction() {
  //   return DDBImporter.lib.DDBSummonsInterface.getConjureConstructs2024;
  // }

  // get generateSummons() {
  //   return true;
  // }

  // get addAutoAdditionalActivities() {
  //   return false;
  // }

  get activity(): IDDBActivityData {
    return {
      data: {
        bonuses: {
          attackDamage: "@item.level",
        },
      },
    };
  }

}
