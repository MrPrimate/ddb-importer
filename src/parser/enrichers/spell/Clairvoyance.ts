import DDBEnricherData from "../data/DDBEnricherData";

export default class Clairvoyance extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getClairvoyance;
  }

  override get generateSummons() {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      noTemplate: true,
      profileKeys: [{ count: 1, name: "Clairvoyance" }],
    };
  }

}
