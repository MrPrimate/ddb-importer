import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

/**
 * The seal damage ignoring resistance is not modelled. Regaining a seal spends this feature's
 * own use and gives one back to the Baleful Interdict pool.
 */
export default class SuperiorInterdict extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Regain Seal",
      activationType: "bonus",
      activationCondition: "You have no seals remaining",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      additionalConsumptionTargets: [_Illrigger.sealConsumeTarget(-1)],
    };
  }

  override get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
    };
  }

}
