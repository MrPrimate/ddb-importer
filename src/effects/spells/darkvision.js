import { baseSpellEffect, generateATLChange, spellEffectModules } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateMacroFlags } from "../macros.js";

export async function darkvisionEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "data.attributes.senses.darkvision",
    value: "60",
    mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
    priority: 20,
  });

  if (spellEffectModules().atlInstalled) {
    effect.changes.push(generateATLChange("ATL.dimSight", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '60', 5));
  } else {
    // MACRO START
    const itemMacroText = await loadMacroFile("spell", "darkvision.js");
    // MACRO STOP
    document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
    effect.changes.push(generateMacroChange(""));
  }

  document.effects.push(effect);

  return document;
}
