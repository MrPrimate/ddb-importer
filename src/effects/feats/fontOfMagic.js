import { baseItemEffect } from "../effects.js";
import { DDBMacros } from "../../lib/_module.mjs";

export async function fontOfMagicEffect(document) {
  let effect = baseItemEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "feat", "fontOfMagic.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "feat", "fontOfMagic.js", ["preItemRoll"]);

  document.effects.push(effect);
  document.system.activation.type = "bonus";
  document.system["target"]["type"] = "self";
  document.system.range = { value: null, units: "self", long: null };

  return document;
}
