/** The parts of a dnd5e enchant activity the link reads, beside its `flags.dnd5e.dependentOn`. */
interface IRiderEnchantActivity {
  item?: {
    uuid?: string | null;
    effects?: { get: (id: string) => { id?: string | null; uuid?: string | null } | undefined };
  } | null;
}

/** The enchantment about to be created, as dnd5e hands it to `dnd5e.preApplyEnchantment`. */
interface IPendingEnchantment {
  flags?: { dnd5e?: { dependentOn?: string } & Record<string, unknown> } & Record<string, unknown>;
}

/**
 * An enchantment applied BY a rider activity is removed with the enchantment that GRANTED that
 * activity.
 *
 * dnd5e copies a profile's rider activities onto the enchanted item and stamps each copy as
 * dependent on the applied enchantment, so the copy goes when the enchantment does. Whatever the
 * copy itself enchanted is linked to nothing: it only records the activity as its origin, which
 * no delete cascade reads. So when Alter Self's Natural Weapons activity enchants the Unarmed
 * Strike and the caster then swaps option or loses concentration, the strike would keep its
 * enchantment, out of reach of the chat tray because the activity that made it is gone.
 *
 * Making the new enchantment depend on the granting one lets dnd5e's own cascade remove it (the
 * cascade runs on the active GM). A link dnd5e already made, to concentration, is left alone.
 */
export default class RiderEnchantmentLink {

  static preApplyEnchantmentHook(
    item: { uuid?: string | null } | null | undefined,
    enchantmentData: IPendingEnchantment,
    { activity }: { activity?: IRiderEnchantActivity | null } = {},
  ): void {
    // dnd5e's activity flag types do not declare the dependency stamp it puts on a rider copy
    const grantingId = activity
      ? foundry.utils.getProperty(activity, "flags.dnd5e.dependentOn") as string | undefined
      : undefined;
    if (!grantingId) return;
    if (enchantmentData.flags?.dnd5e?.dependentOn) return;

    const granting = activity?.item?.effects?.get(grantingId);
    if (!granting?.id || !granting.uuid) return;

    // dnd5e reads a short value as an effect id on the dependent's OWN item, which also keeps its
    // same-item suppression working; an effect on another item has to be named by uuid
    const sameItem = !!item?.uuid && item.uuid === activity?.item?.uuid;
    enchantmentData.flags ??= {};
    enchantmentData.flags.dnd5e ??= {};
    enchantmentData.flags.dnd5e.dependentOn = sameItem ? granting.id : granting.uuid;
  }

}
