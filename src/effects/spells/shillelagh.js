import { baseEnchantmentEffect } from "../effects.js";

export function shillelaghEffect(document) {
  document.system.actionType = "ench";

  foundry.utils.setProperty(document, "system.enchantment", {
    restrictions: {
      allowMagical: true,
      type: "weapon",
    },
  });

  const baseEffects = [
    {
      key: "name",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `{} [${document.name}]`,
      priority: 20,
    },
    {
      key: "system.properties",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "mgc",
      priority: 20,
    },
  ];

  let wisdomEffect = baseEnchantmentEffect(document, `${document.name}: Use Spellcasting Modifier`, { transfer: false });
  wisdomEffect._id = foundry.utils.randomID();
  wisdomEffect.changes.push(
    ...baseEffects,
    {
      key: "system.ability",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "wis", // @attributes.spellcasting - system.ability only takes a numerical value
      priority: 20,
    },
  );
  document.effects.push(wisdomEffect);

  let effect = baseEnchantmentEffect(document, `${document.name}: No Spellcasting Modifier`);
  effect.changes.push(...baseEffects);
  document.effects.push(effect);

  return document;
}
