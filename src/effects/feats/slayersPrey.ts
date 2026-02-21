import { baseFeatEffect } from "../effects";
import { DDBMacros } from "../../lib/_module";

// this one is a bit different, the macro is triggered by midi-qol and applies effects to the actor
// the Marked effect gets applied to the target
export async function slayersPreyEffect(document) {
  const effect = baseFeatEffect(document, `Marked by ${document.name}`, { transfer: true });
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

  const damageBonusEffect = baseFeatEffect(document, document.name, { transfer: true });
  damageBonusEffect.changes.push({
    key: "flags.dnd5e.DamageBonusMacro",
    value: DDBMacros.generateItemMacroValue({ macroType: "feat", macroName: "slayersPrey.js", document }),
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: 20,
  });
  document.effects.push(damageBonusEffect);

  await DDBMacros.setItemMacroFlag(document, "feat", "slayersPrey.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "feat", "slayersPrey.js", ["postActiveEffects"]);

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
