import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, area, castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast: the line blasts from the caster and catches a creature
 * that starts its turn in it. Turning the line is a Bonus Action that means rotating the region.
 * Movement toward the caster costs double, which is directional and has no region form.
 * The Magus Class has an unrelated Bitter Wind cantrip (a plain Constitution save), which keeps
 * the default parse.
 */
export default class BitterWind extends DDBEnricherData {

  get isCantrip(): boolean {
    return (this.ddbParser?.ddbDefinition as IDDBSpellDefinition | undefined)?.level === 0;
  }

  override get type(): IDDBActivityType | null {
    if (this.isCantrip) return null;
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData | null {
    if (this.isCantrip) return null;
    return castPlacer([
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenTurnStart"],
        activityName: ONGOING,
        excludeSelf: true,
      }),
    ], { target: area("line", "120", { width: "20" }) });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isCantrip) return [];
    return [
      ongoingTrigger({
        condition: "Starts its turn in the line (Disadvantage in cold weather, in darkness, or when upcast)",
      }),
    ];
  }

}
