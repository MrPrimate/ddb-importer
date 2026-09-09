import _SaveAdvantageVsCondition from "./_SaveAdvantageVsCondition";

export default class DarkDevotion extends _SaveAdvantageVsCondition {

  override get saveAdvantageStatuses(): string[] {
    return ["charmed", "frightened"];
  }

}
