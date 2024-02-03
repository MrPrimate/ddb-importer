import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";
import { effectModules, generateATLChange } from "../effects.js";

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
  } else if (effectModules().midiQolInstalled) {
    await DDBMacros.setItemMacroFlag(document, "spell", "darkvision.js");
    effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "darkvision.js" }));
  }

  document.effects.push(effect);

  return document;
}
