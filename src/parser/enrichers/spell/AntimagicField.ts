import DDBEnricherData from "../data/DDBEnricherData";
import { emanation } from "../data/RegionBuilders";

/**
 * Antimagic Field: a 10-foot emanation that moves with the caster (DDB records the 2014 spell as a
 * sphere, which dnd5e would place as a fixed circle). On dnd5e 6.1 the activity places
 * it with the system's antimagic behavior, as the SRD spell does, so creatures inside get the
 * `antimagic` status and their items stop working as magic. Earlier versions keep the parser's
 * activity: the area has no automation there.
 */
export default class AntimagicField extends DDBEnricherData {

  get antimagicBehavior(): I5eActivityBehavior | null {
    return DDBEnricherData.BehaviorHelper.antimagic();
  }

  override get type(): IDDBActivityType | null {
    return this.antimagicBehavior ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : null;
  }

  override get activity(): IDDBActivityData | null {
    const behavior = this.antimagicBehavior;
    if (!behavior) return null;
    return {
      name: "Cast",
      data: {
        target: emanation("10"),
        behaviors: [behavior],
      },
    };
  }

}
