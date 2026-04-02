import AutoEffects from "./AutoEffects";

export default class EnchantmentEffects {

  static EnchantmentEffect(document, label,
    { transfer = false, disabled = false, origin = null, id = null, description = null, durationSeconds = null,
      durationRounds = null, durationTurns = null } = {},
  ) {
    const effect: I5eEffectData = AutoEffects.BaseEffect(document, label, { transfer, disabled, description, durationSeconds, durationRounds, durationTurns });
    foundry.utils.setProperty(effect, "flags.dnd5e.type", "enchantment");
    effect._id = id ?? foundry.utils.randomID();
    effect.origin = origin ?? null;
    return effect;
  }


  static addMagicalBonus({ effect, nameAddition = null, bonus = null, bonusMode = "override",
    makeMagical = true }: { effect: I5eEffectData; nameAddition?: string | null; bonus?: string | null; bonusMode?: TActiveEffectChangeType; makeMagical?: boolean },
  ) {
    const name = nameAddition
      ? `, ${nameAddition}`
      : ` (${effect.name})`;
    effect.system.changes.push(
      {
        key: "name",
        type: "override" as TActiveEffectChangeType,
        value: `{}${name}`,
        priority: 20,
      },
    );
    if (bonus !== null) {
      effect.system.changes.push(
        {
          key: "system.magicalBonus",
          type: bonusMode,
          value: `${bonus}`,
          priority: 20,
        },
      );
    }

    if (makeMagical) {
      effect.system.changes.push(
        {
          key: "system.properties",
          type: "add" as TActiveEffectChangeType,
          value: "mgc",
          priority: 20,
        },
      );
    }
    return effect;
  }

}
