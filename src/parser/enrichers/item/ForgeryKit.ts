import DDBEnricherData from "../data/DDBEnricherData";
import { hasToolUses, toolCheck, extraToolCheck } from "./_ToolChecks";

export default class ForgeryKit extends DDBEnricherData {

  override get activity(): IDDBActivityData | null {
    return hasToolUses(this) ? toolCheck(this, "Mimic Handwriting", "dex", 15) : null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return hasToolUses(this) ? [extraToolCheck(this, "Duplicate Wax Seal", "dex", 20)] : [];
  }

}
