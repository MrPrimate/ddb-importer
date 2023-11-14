import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function ensnaringStrikeEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  await DDBMacros.setItemMacroFlag(document, "spell", "ensnaringStrike.js");
  effect.changes.push(
    DDBMacros.generateOnUseMacroChange({ macroPass: "postActiveEffects", macroType: "spell", macroName: "ensnaringStrike.js", document }),
  );
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);

  document.effects.push(effect);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.actionType = null;
  document.system.save.ability = "";
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "ensnaringStrike.js", ["preTargeting"]);

  return document;
}
