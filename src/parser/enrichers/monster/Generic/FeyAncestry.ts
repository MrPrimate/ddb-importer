import _SaveAdvantageVsCondition from "./_SaveAdvantageVsCondition";

export default class FeyAncestry extends _SaveAdvantageVsCondition {

  override get saveAdvantageStatuses(): string[] {
    return ["charmed"];
  }

}
