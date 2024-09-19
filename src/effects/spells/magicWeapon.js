import { addMagicalBonusToEnchantmentEffect, baseEnchantmentEffect } from "../effects.js";

export function magicWeaponEffect(document) {
  const enchantments = [
    { bonus: "1", min: null, max: 3 },
    { bonus: "2", min: 4, max: 5 },
    { bonus: "3", min: 6, max: null },
  ];
  document.system.actionType = "ench";
  foundry.utils.setProperty(document, "system.enchantment", {
    restrictions: {
      allowMagical: false,
      type: "weapon",
    },
  });
  for (const e of enchantments) {
    let effect = baseEnchantmentEffect(document, `${document.name}: +${e.bonus}`, {
      description: `This weapon has become a +${e.bonus} magic weapon, granting a bonus to attack and damage rolls.`,
    });
    foundry.utils.setProperty(effect, "flags.dnd5e.enchantment.level", { min: e.min, max: e.max });
    addMagicalBonusToEnchantmentEffect({
      effect,
      nameAddition: `+${e.bonus}`,
      bonus: e.bonus,
    });
    document.effects.push(effect);
  }

  return document;
}
