import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.mjs";
import { effectModules } from "../effects.js";

export async function darknessEffect(document) {
  const macroToggle = `<br><p>[[/ddbifunc functionName="darkness" functionType="spell"]]{Darkness Toggle}</div></p>`;
  document.system.description.value += macroToggle;
  if (document.system.description.chat !== "") document.system.description.chat += macroToggle;

  if (!effectModules().midiQolInstalled) return document;

  let effect = baseSpellEffect(document, document.name);
  // foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
  foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);
  await DDBMacros.setItemMacroFlag(document, "spell", "darkness.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "darkness.js" }));
  document.effects.push(effect);
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "darkness.js", ["preTargeting"]);
  return document;
}
