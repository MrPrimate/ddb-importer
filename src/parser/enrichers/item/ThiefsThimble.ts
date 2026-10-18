import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";

/**
 * The thimble's 30 Hit Points are its uses; each point of trap damage it absorbs spends one, and it
 * breaks at 0 rather than recovering.
 */
export default class ThiefsThimble extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Absorb Trap Damage",
      activationType: "special",
      activationCondition: "You trigger a trap and take damage",
      targetType: "self",
      addItemConsume: true,
      itemConsumeValue: "1",
      addScalingMode: "amount",
      addScalingFormula: "1",
      addConsumptionScalingMax: "@item.uses.value",
    };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "30");
  }

}
