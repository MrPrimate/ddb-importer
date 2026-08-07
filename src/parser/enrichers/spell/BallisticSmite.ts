import DDBEnricherData from "../data/DDBEnricherData";

export default class BallisticSmite extends DDBEnricherData {

  get combineDamageTypes() {
    return true;
  }

  /** parses as an attack from the description wording; it is bonus damage */
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Damage",
      activationType: "bonus",
      allowCritical: true,
    };
  }

}
