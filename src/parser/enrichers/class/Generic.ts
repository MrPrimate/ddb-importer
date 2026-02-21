import DDBEnricherData from "../data/DDBEnricherData";
import type { DDBOverrideData } from "../data/types";

export default class Generic extends DDBEnricherData {

  get actionType(): string {
    return "class";
  }

  get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  get override(): DDBOverrideData | null {
    return null;
  }

}
