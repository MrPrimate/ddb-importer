import DDBEnricherData from "../data/DDBEnricherData";
import { hasToolUses, toolCheck, extraToolCheck } from "./_ToolChecks";

export default class GamingSetChecks extends DDBEnricherData {

  override get activity(): IDDBActivityData | null {
    return hasToolUses(this) ? toolCheck(this, "Catch Cheating", "wis", 10) : null;
  }

  override get override(): IDDBOverrideData | null {
    return hasToolUses(this) ? { data: { "system.ability": "wis" } } : null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return hasToolUses(this) ? [extraToolCheck(this, "Play to Win", "wis", 20)] : [];
  }

}
