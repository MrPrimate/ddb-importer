import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function magicStoneEffect(document) {
  const itemMacroText = await loadMacroFile("spell", "magicStone.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  setProperty(document, "flags.ddbimporter.effect", {
    dice: document.system.damage.parts[0][0],
    damageType: document.system.damage.parts[0][1],
  });
  document.system.damage.parts = [];
  document.system.actionType = "other";
  document.system.target.type = "self";
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postActiveEffects]ItemMacro");

  let effect = baseSpellEffect(document, document.name);
  setProperty(effect, "duration.seconds", 60);
  document.effects.push(effect);
  return document;
}
