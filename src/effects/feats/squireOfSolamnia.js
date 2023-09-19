import { baseItemEffect } from "../effects.js";
import DDBMacros from "../macros.js";

export async function squireOfSolamniaEffect(document) {
  let effect = baseItemEffect(document, document.name);
  const itemMacroText = await DDBMacros.loadMacroFile("feat", "squireOfSolamnia.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange(`"${document.name}"`));
  effect.transfer = false;

  effect.changes.push(
    {
      key: "flags.midi-qol.advantage.attack.mwak",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "1",
      priority: "20",
    },
    {
      key: "flags.midi-qol.advantage.attack.rwak",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "1",
      priority: "20",
    },
    {
      key: "flags.dnd5e.DamageBonusMacro",
      value: "ItemMacro",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: 20,
    }
  );
  setProperty(effect, "flags.dae.specialDuration", ["1Attack"]);
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.effects.push(effect);

  document.system.damage.parts = [];
  document.system.actionType = null;

  return document;
}
