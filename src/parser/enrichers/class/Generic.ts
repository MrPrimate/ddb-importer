import DDBEnricherData from "../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../DDBClassFeatureEnricher";

export default class Generic extends DDBEnricherData<DDBClassFeatureEnricher> {

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
