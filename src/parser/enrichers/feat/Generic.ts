import DDBEnricherData from "../data/DDBEnricherData";

export default class Generic extends DDBEnricherData {

  get actionType(): string {
    return "feat";
  }

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData | null {
    return null;
  }

}
