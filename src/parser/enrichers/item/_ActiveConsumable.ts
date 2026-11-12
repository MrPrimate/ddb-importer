import { riders, toggleOffChanges } from "../data/SelfEnchant";

/**
 * A consumable whose benefit lasts after it is drunk, and whose follow-up activities only make sense
 * while it does (Potion of Fire Breath's breaths). Drinking is a self-enchantment lasting the
 * potion's duration. Its riders are those follow-up activities, which dnd5e hides on the item until
 * the enchantment is applied and then adds as fresh usable copies, and an effect that transfers to
 * the drinker so the potion can be tracked.
 *
 * The drink spends one of the stack's quantity (`spendOwnQuantity`), so the item stays at quantity 0
 * and the enchantment outlives the last potion. dnd5e removes a self-enchantment on the activity's
 * next use, so while it is applied Drink is renamed for that and spends nothing. The generic tracking
 * effect is off: the rider effect does that job.
 */

export const ACTIVE_CONSUMABLE_OVERRIDE: IDDBOverrideData = { spendOwnQuantity: true, trackingEffect: false };

/** The drink: a self-enchantment that spends the item and lasts `duration`. */
export function activeConsumableDrink({
  name = "Drink",
  activationType,
  duration,
}: {
  name?: string;
  activationType: TActivationCost;
  duration: { value: string; units: TDurationUnit };
}): IDDBActivityData {
  return {
    name,
    activationType,
    addItemConsume: true,
    noTemplate: true,
    rangeSelf: true,
    targetType: "self",
    // potions are magical, and dnd5e refuses to enchant a magical item without this
    allowMagical: true,
    data: {
      enchant: { self: true },
      duration: { ...duration, concentration: false },
    },
  };
}

/**
 * The rider effect the drinker carries while the potion lasts, and the enchantment the drink
 * applies, whose riders are that effect and `activityRiders`. `riderEffect` adds to the rider effect
 * (Midi-QOL changes, for instance).
 */
export function activeConsumableEffects({
  name,
  drinkName = "Drink",
  endName,
  effectId,
  description,
  activityRiders,
  riderEffect = {},
}: {
  name: string;
  drinkName?: string;
  endName: string;
  effectId: string;
  description: string;
  activityRiders: string[];
  riderEffect?: Partial<IDDBEffectHint>;
}): IDDBEffectHint[] {
  return [
    {
      name,
      ...riderEffect,
      options: {
        transfer: true,
        durationSeconds: null,
        description,
        ...(riderEffect.options ?? {}),
      },
      data: { ...(riderEffect.data ?? {}), _id: effectId },
    },
    {
      name,
      type: "enchant",
      activityMatch: drinkName,
      changes: toggleOffChanges(endName),
      data: {
        flags: {
          ddbimporter: riders({ activities: activityRiders, effects: [effectId] }),
        },
      },
    },
  ];
}
