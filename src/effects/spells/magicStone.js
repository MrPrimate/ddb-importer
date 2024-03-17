import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function magicStoneEffect(document) {
  await DDBMacros.setItemMacroFlag(document, "spell", "magicStone.js");
  foundry.utils.setProperty(document, "flags.ddbimporter.effect", {
    dice: document.system.damage.parts[0][0],
    damageType: document.system.damage.parts[0][1],
  });
  document.system.damage.parts = [];
  document.system.actionType = "other";
  document.system.target.type = "self";
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "magicStone.js", ["postActiveEffects"]);
  let effect = baseSpellEffect(document, document.name);
  foundry.utils.setProperty(effect, "duration.seconds", 60);
  document.effects.push(effect);
  return document;
}
