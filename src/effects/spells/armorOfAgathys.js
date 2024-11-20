import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.mjs";

export async function armorOfAgathysEffect(document) {
  document.effects = [];
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.dae.onUpdateTarget",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "Armor of Agathys,ItemMacro,system.attributes.hp.temp,@item.level",
      priority: 20,
    },
  );
  effect.duration.seconds = 3600;
  foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
  foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.effects.push(effect);

  await DDBMacros.setItemMacroFlag(document, "spell", "armorOfAgathys.js");

  return document;
}
