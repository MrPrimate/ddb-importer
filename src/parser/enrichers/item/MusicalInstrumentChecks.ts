import DDBEnricherData from "../data/DDBEnricherData";
import { hasToolUses, toolCheck, extraToolCheck } from "./_ToolChecks";

export default class MusicalInstrumentChecks extends DDBEnricherData {

  override get activity(): IDDBActivityData | null {
    return hasToolUses(this) ? toolCheck(this, "Play a Known Tune", "cha", 10) : null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return hasToolUses(this) ? [extraToolCheck(this, "Improvise a Song", "cha", 15)] : [];
  }

}
