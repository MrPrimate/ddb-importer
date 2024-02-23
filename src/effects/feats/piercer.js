
import { baseFeatEffect } from "../specialFeats.js";
import DDBMacros from "../DDBMacros.js";

async function commonPiercer(document) {
  document.system.target = {
    value: null,
    width: null,
    units: "",
    type: "self",
  };
  document.system.range = {
    value: null,
    long: null,
    units: "self",
  };
  await DDBMacros.setItemMacroFlag(document, "feat", "piercer.js");
  return document;
};

export async function piercerCriticalEffect(document) {
  const effect = baseFeatEffect(document, document.name, { transfer: true });
  effect.changes.push(
    {
      key: "flags.dnd5e.DamageBonusMacro",
      value: DDBMacros.generateItemMacroValue({ macroType: "feat", macroName: "piercer.js", document }),
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: 20,
    },
  );
  document.effects.push(effect);

  await commonPiercer(document);

  return document;
}


export async function piercerRerollEffect(document) {
  const effect = baseFeatEffect(document, document.name, { transfer: true });
  effect.changes.push(
    DDBMacros.generateOnUseMacroChange({ macroPass: "postDamageRoll", macroType: "feat", macroName: "piercer.js", document }),
  );
  document.effects.push(effect);

  await commonPiercer(document);
  return document;
}
