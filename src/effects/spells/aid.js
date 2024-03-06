import DDBMacros from "../DDBMacros.js";
import { effectModules } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export async function aidEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  if (effectModules().midiQolInstalled) {
    effect.changes.push({
      key: "system.attributes.hp.tempmax",
      value: "5 * (@spellLevel - 1)",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 20,
    });
    document.system.damage = { parts: [], versatile: "", value: "" };
    await DDBMacros.setItemMacroFlag(document, "spell", "aid.js");
    effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@spellLevel", macroType: "spell", macroName: "aid.js", priority: 0 }));
  } else if (effectModules().daeInstalled) {
    effect.changes.push({
      key: "system.attributes.hp.tempmax",
      value: "5 * (@spellLevel - 1)",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 20,
    });
  }
  document.effects.push(effect);
  return document;
}
