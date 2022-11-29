import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function armorOfAgathysEffect(document) {
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
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.effects.push(effect);

  const itemMacroText = await loadMacroFile("spell", "armorOfAgathys.js");
  setProperty(document, "flags.itemacro", generateItemMacroFlag(document, itemMacroText));
  setProperty(document, "system.actionType", "util");

  return document;
}
