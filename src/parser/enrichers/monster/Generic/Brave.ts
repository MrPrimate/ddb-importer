import _SaveAdvantageVsCondition from "./_SaveAdvantageVsCondition";

export default class Brave extends _SaveAdvantageVsCondition {

  override get saveAdvantageStatuses(): string[] {
    return ["frightened"];
  }

}
