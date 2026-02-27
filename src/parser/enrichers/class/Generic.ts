import DDBEnricherData from "../data/DDBEnricherData";

export default class Generic extends DDBEnricherData {

  get actionType(): string {
    return "class";
  }

  get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  get override(): IDDBOverrideData | null {
    return null;
  }

}
