import _SaveAdvantageVsCondition from "./_SaveAdvantageVsCondition";

export default class MentalFortitude extends _SaveAdvantageVsCondition {

  override get saveAdvantageStatuses(): string[] {
    return ["charmed", "frightened"];
  }

}
