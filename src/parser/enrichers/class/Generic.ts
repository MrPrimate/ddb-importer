import DDBEnricherData from "../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../DDBClassFeatureEnricher";

export default class Generic extends DDBEnricherData<DDBClassFeatureEnricher> {

  get actionType(): string {
    return "class";
  }

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData | null {
    return null;
  }

}
