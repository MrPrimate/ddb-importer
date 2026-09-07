import DDBEnricherData from "../data/DDBEnricherData";

export default class BallisticSmite extends DDBEnricherData {

  override get combineDamageTypes(): boolean {
    return true;
  }

  /** parses as an attack from the description wording; it is bonus damage */
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Damage",
      activationType: "bonus",
      allowCritical: true,
    };
  }

}
