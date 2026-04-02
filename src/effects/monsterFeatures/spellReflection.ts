import { DDBMacros } from "../../lib/_module";
import { baseEffect } from "../effects";

export async function spellReflectionEffect(document) {

  foundry.utils.setProperty(document, "system.activation.type", "special");
  foundry.utils.setProperty(document, "system.actionType", "other");

  await DDBMacros.setItemMacroFlag(document, "monsterFeature", "spellReflection.js");

  const effect = baseEffect(document, document.name, { transfer: true, disabled: false });
  effect.system.changes.push(
    DDBMacros.generateOnUseMacroChange({ macroPass: "isSaveSuccess", macroType: "monsterFeature", macroName: "spellReflection.js", document }),
    DDBMacros.generateOnUseMacroChange({ macroPass: "isAttacked", macroType: "monsterFeature", macroName: "spellReflection.js", document }),
  );
  document.effects.push(effect);

  return document;
}
