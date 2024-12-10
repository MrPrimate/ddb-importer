import { DDBMacros } from "../../lib/_module.mjs";
import { baseEffect } from "../effects.js";

export async function spellReflectionEffect(document) {

  foundry.utils.setProperty(document, "system.activation.type", "special");
  foundry.utils.setProperty(document, "system.actionType", "other");

  await DDBMacros.setItemMacroFlag(document, "monsterFeature", "spellReflection.js");

  let effect = baseEffect(document, document.name, { transfer: true, disabled: false });
  effect.changes.push(
    DDBMacros.generateOnUseMacroChange({ macroPass: "isSaveSuccess", macroType: "monsterFeature", macroName: "spellReflection.js", document }),
    DDBMacros.generateOnUseMacroChange({ macroPass: "isAttacked", macroType: "monsterFeature", macroName: "spellReflection.js", document }),
  );
  document.effects.push(effect);

  return document;
}
