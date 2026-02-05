/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class SummonElemental extends DDBEnricherData {

  // get type() {
  //   return "summon";
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

  get activity() {
    return {
      data: {
        bonuses: {
          attackDamage: "@item.level",
        },
      },
    };
  }

}
