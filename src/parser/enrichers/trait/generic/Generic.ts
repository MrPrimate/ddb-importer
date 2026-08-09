import DDBEnricherData from "../../data/DDBEnricherData";

export default class Generic extends DDBEnricherData {

  get actionType(): string {
    return "race";
  }

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData | null {
    return null;
  }

}
