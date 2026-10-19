import DDBEnricherData from "../data/DDBEnricherData";
import type DDBItem from "../../item/DDBItem";
import { itemUses } from "./_ItemActivities";

/**
 * The absorption stones cancel a spell aimed only at you as a Reaction, spending one charge per
 * level of the spell from a pool that never recovers (the stone burns out).
 */
export default abstract class _IounAbsorption extends DDBEnricherData {

  abstract maxSpellLevel: number;
  abstract defaultPool: number;

  get pool(): number {
    const text = (this.ddbParser as DDBItem).ddbDefinition.description ?? "";
    return Number((/\bcanceled (\d+) levels\b/i).exec(text)?.[1] ?? this.defaultPool);
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cancel Spell",
      activationType: "reaction",
      activationCondition: `A creature you can see casts a spell of level ${this.maxSpellLevel} or lower targeting only you`,
      targetType: "creature",
      targetCount: "1",
      addItemConsume: true,
      itemConsumeValue: "1",
      addScalingMode: "amount",
      addScalingFormula: "1",
      addConsumptionScalingMax: `${this.maxSpellLevel}`,
    };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, String(this.pool));
  }

}
