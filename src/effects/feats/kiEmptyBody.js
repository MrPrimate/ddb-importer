import { baseFeatEffect } from "../specialFeats.js";
import { generateMacroChange, generateMacroFlags, loadMacroFile } from "../macros.js";

export async function kiEmptyBodyEffect(document) {
  let effect = baseFeatEffect(document, document.name);
  effect.changes.push(
    { key: "data.traits.dr.all", value: "", mode: 0, priority: 0 },
    { key: "data.traits.dv.value", value: "force", mode: 0, priority: 0 },
  );

  document.data['target']['type'] = "self";
  document.data.range = { value: null, units: "self", long: null };
  document.data.duration = { value: 1, units: "min" };
  document.data.actionType = null;
  const itemMacroText = await loadMacroFile("spell", "invisibility.js");
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange("", 0));

  document.effects.push(effect);
  return document;
}
