import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateItemMacroFlag, setMidiOnUseMacroFlag, generateOnUseMacroChange } from "../macros.js";

export async function ensnaringStrikeEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  const itemMacroText = await loadMacroFile("spell", "ensnaringStrike.js");
  document = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(
    generateOnUseMacroChange({ macroPass: "postActiveEffects", macroType: "spell", macroName: "ensnaringStrike.js", document }),
  );
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);

  document.effects.push(effect);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.actionType = null;
  document.system.save.ability = "";
  setMidiOnUseMacroFlag(document, "spell", "ensnaringStrike.js", ["preTargeting"]);

  return document;
}
