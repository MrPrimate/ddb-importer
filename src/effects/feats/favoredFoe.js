import { baseFeatEffect } from "../effects.js";
import { DDBMacros } from "../../lib/_module.mjs";

// this one is a bit different, the macro is triggered by midi-qol and applies effects to the actor
// the Marked effect gets applied to the target
export async function favoredFoeEffect(document) {
  let effect = baseFeatEffect(document, `Marked by ${document.name}`, { transfer: false });
  effect.changes.push(
    {
      key: "flags.dae.onUpdateSource",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: document.name,
      priority: 20,
    },
  );
  effect.duration.seconds = 60;
  document.effects.push(effect);

  let damageBonusEffect = baseFeatEffect(document, document.name, { transfer: true });
  damageBonusEffect.changes.push({
    key: "flags.dnd5e.DamageBonusMacro",
    value: DDBMacros.generateItemMacroValue({ macroType: "feat", macroName: "favoredFoe.js", document }),
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: 20,
  });
  document.effects.push(damageBonusEffect);

  await DDBMacros.setItemMacroFlag(document, "feat", "favoredFoe.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "feat", "favoredFoe.js", ["postActiveEffects"]);

  foundry.utils.setProperty(document, "system.actionType", "util");
  document.system.damage.parts = [];
  document.system.target = {
    value: 1,
    width: null,
    units: "",
    type: "creature",
  };
  document.system.range = {
    value: null,
    long: null,
    units: "",
  };

  return document;
}
