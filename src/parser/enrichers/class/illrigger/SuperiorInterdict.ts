import DDBEnricherData from "../../data/DDBEnricherData";
import DDBDataUtils from "../../../lib/DDBDataUtils";
import _Illrigger from "./_Illrigger";

/**
 * Damage from burned seals ignores Resistance: the seals burn through Baleful Interdict's damage
 * activities, so the rule matches rolls made with that feature. Regaining a seal spends this
 * feature's own use and gives one back to the Baleful Interdict pool.
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

  override get effects(): IDDBEffectHint[] {
    const identifier = DDBDataUtils.featureIdentifier("Baleful Interdict", this.ddbParser?.klass);
    return DDBEnricherData.ignoreDamageReductionEffect("Superior Interdict", "ALL", {
      immunity: false,
      conditions: { k: "item.identifier", o: "exact", v: identifier },
    });
  }

  override get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
    };
  }

}
