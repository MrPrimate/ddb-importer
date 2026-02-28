import DDBEnricherData from "../data/DDBEnricherData";

export default class Clairvoyance extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getClairvoyance;
  }

  get generateSummons() {
    return true;
  }

  get activity() {
    return {
      noTemplate: true,
      profileKeys: [{ count: 1, name: "Clairvoyance" }],
    };
  }

}
