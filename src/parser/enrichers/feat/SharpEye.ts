import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Ravenloft origin feat. A failed check does not spend the use, so the activity is the manual
 * step taken after a successful Search or Study check (the official module's shape).
 */
export default class SharpEye extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      // the id DDB's matching action gave the activity before this enricher, kept for re-imports
      id: "utilityShaEyfNe0",
      name: "Expend Use on Success",
      activationType: "special",
      activationCondition: "You succeed on a Search or Study ability check you gave yourself Advantage on",
      targetType: "self",
      addItemConsume: true,
    };
  }

}
