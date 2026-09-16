import DDBEnricherData from "../data/DDBEnricherData";
import { hasToolUses, toolCheck, extraToolCheck } from "./_ToolChecks";

export default class CooksUtensils extends DDBEnricherData {

  override get activity(): IDDBActivityData | null {
    return hasToolUses(this) ? toolCheck(this, "Improve Flavor", "wis", 10) : null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return hasToolUses(this) ? [extraToolCheck(this, "Detect Spoiled or Poisoned Food", "wis", 15)] : [];
  }

}
