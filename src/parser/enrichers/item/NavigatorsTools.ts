import DDBEnricherData from "../data/DDBEnricherData";
import { hasToolUses, toolCheck, extraToolCheck } from "./_ToolChecks";

export default class NavigatorsTools extends DDBEnricherData {

  override get activity(): IDDBActivityData | null {
    return hasToolUses(this) ? toolCheck(this, "Plot a Course", "wis", 10) : null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return hasToolUses(this) ? [extraToolCheck(this, "Determine Position by Stargazing", "wis", 15)] : [];
  }

}
