import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

/**
 * DDB's three boon actions are kept, with By the Throat and Dispater's Supremacy hidden until
 * the illrigger reaches 13th and 18th level. Telekinetic Seal answers a creature moving within
 * 5 feet; with no region behaviours below dnd5e 6.0 the reaction stays DDB's own save activity,
 * used by hand.
 */
export default class DispatersInterdiction extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Telekinetic Seal", type: "class" } },
      {
        action: { name: "By the Throat", type: "class" },
        overrides: { data: _Illrigger.boonVisibility(13) },
      },
      {
        action: { name: "Dispater's Supremacy (Passive)", type: "class" },
        overrides: { data: _Illrigger.boonVisibility(18) },
      },
    ];
  }

}
