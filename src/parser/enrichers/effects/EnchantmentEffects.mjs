import AutoEffects from "./AutoEffects.mjs";

export default class EnchantmentEffects extends AutoEffects {

  static EnchantmentEffect(document, label,
    { transfer = false, disabled = false, origin = null, id = null, description = null, durationSeconds = null,
      durationRounds = null, durationTurns = null } = {},
  ) {
    const effect = AutoEffects.BaseEffect(document, label, { transfer, disabled, description, durationSeconds, durationRounds, durationTurns });
    foundry.utils.setProperty(effect, "flags.dnd5e.type", "enchantment");
    effect._id = id ?? foundry.utils.randomID();
    effect.origin = origin ?? null;
    return effect;
  }


  static addMagicalBonus({ effect, nameAddition = null, bonus = null, bonusMode = "OVERRIDE",
    makeMagical = true } = {},
  ) {
    const name = nameAddition ?? `(${effect.name})`;
    effect.changes.push(
      {
        key: "name",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: `{}, ${name}`,
        priority: 20,
      },
    );
    if (bonus !== null) {
      effect.changes.push(
        {
          key: "system.magicalBonus",
          mode: CONST.ACTIVE_EFFECT_MODES[bonusMode],
          value: `${bonus}`,
          priority: 20,
        },
      );
    }

    if (makeMagical) {
      effect.changes.push(
        {
          key: "system.properties",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "mgc",
          priority: 20,
        },
      );
    }
    return effect;
  }

}
