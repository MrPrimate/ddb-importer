import DDBEnricherData from "./DDBEnricherData";

/**
 * Helpers for documents whose "on" state is a self-enchantment (`enchant: { self: true }`) on the
 * document itself, whose profile carries the activities used while it is on as activity riders and
 * the actor's effects as effect riders. dnd5e hides a rider activity on its item until the
 * enchantment is applied and adds a usable copy, so those activities only appear while the state is
 * on. Effect riders must transfer to reach the actor once copied.
 *
 * Using the enchant activity again removes the enchantment. dnd5e runs that use like any other,
 * so while the enchantment is applied the activity is renamed for what it now does and spends
 * nothing. Spells have more to switch off on that use: see spell/_SelfEnchantSpell.
 */

/**
 * Changes a toggle's profile makes while applied: the item name gains "(Active)", and the enchant
 * activity (`activities[enchant]`, so the document must have only the one) becomes the free
 * deactivation. EnchantmentEffects.zeroConsumptionClears keeps the consumption clear working after
 * an import round trip. A toggle that needs `concentration` also stops that use beginning a new
 * concentration, which would replace the one the state depends on.
 */
export function toggleOffChanges(endName: string, { concentration = false }: { concentration?: boolean } = {}): IActiveEffectChangeData[] {
  return [
    DDBEnricherData.ChangeHelper.overrideChange("{} (Active)", 90, "name"),
    DDBEnricherData.ChangeHelper.overrideChange(endName, 90, "activities[enchant].name"),
    DDBEnricherData.ChangeHelper.overrideChange("[]", 90, "activities[enchant].consumption.targets"),
    ...(concentration
      ? [
        DDBEnricherData.ChangeHelper.overrideChange("true", 90, "activities[enchant].duration.override"),
        DDBEnricherData.ChangeHelper.overrideChange("false", 90, "activities[enchant].duration.concentration"),
      ]
      : []),
  ];
}

/** The rider fields of a profile's `flags.ddbimporter`. */
export function riders({ activities = [], effects = [] }: { activities?: string[]; effects?: string[] }): { activityRiders: string[]; effectRiders: string[] } {
  return {
    activityRiders: activities,
    effectRiders: effects,
  };
}
