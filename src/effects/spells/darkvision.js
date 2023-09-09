import { baseSpellEffect, generateATLChange } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";
import { effectModules } from "../effects.js";

export async function darkvisionEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "system.attributes.senses.darkvision",
    value: "60",
    mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
    priority: 20,
  });

  if (effectModules().atlInstalled) {
    effect.changes.push(
      generateATLChange("ATL.sight.range", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 60, 5),
      generateATLChange("ATL.sight.visionMode", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "darkvision", 5),
    );
  } else {
    const itemMacroText = await loadMacroFile("spell", "darkvision.js");
    document = generateItemMacroFlag(document, itemMacroText);
    effect.changes.push(generateMacroChange(""));
  }

  document.effects.push(effect);

  return document;
}
