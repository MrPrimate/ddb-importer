import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function flameBladeEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    DDBMacros.generateMacroChange({ macroValues: "@spellLevel", macroType: "spell", macroName: "flameBlade.js" })
  );

  effect.changes.push(
    {
      key: "ATL.light.dim",
      mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
      value: "20",
      priority: 20,
    },
    {
      key: "ATL.light.bright",
      mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
      value: "10",
      priority: 20,
    }
  );
  foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
  foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.system.actionType = "other";
  document.effects.push(effect);
  document.system.damage = { parts: [], versatile: "", value: "" };
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "flameBlade.js", ["preTargeting"]);
  await DDBMacros.setItemMacroFlag(document, "spell", "flameBlade.js");
  return document;
}
