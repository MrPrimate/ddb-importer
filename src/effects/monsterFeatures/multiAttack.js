import DDBMacros from "../DDBMacros.mjs";
import { baseEffect } from "../effects.js";

export async function multiAttackEffect(document) {
  let effect = baseEffect(document, document.name, { transfer: true, disabled: false });
  await DDBMacros.setItemMacroFlag(document, "monsterFeature", "multiAttack.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "monsterFeature", "multiAttack.js", ["preCompleted"]);
  document.effects.push(effect);
  return document;
}
