
import { baseFeatEffect } from "../specialFeats.js";
import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

async function commonPiercer(document) {
  const itemMacroText = await loadMacroFile("feat", "piercer.js");
  setProperty(document, "flags.itemacro", generateItemMacroFlag(document, itemMacroText));
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
  return document;
};

export async function piercerCriticalEffect(document) {
  const effect = baseFeatEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.dnd5e.DamageBonusMacro",
      value: "ItemMacro",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: 20,
    },
  );
  effect.transfer = true;

  setProperty(effect, "flags.dae.transfer", true);
  document.effects.push(effect);

  await commonPiercer(document);

  return document;
}


export async function piercerRerollEffect(document) {
  const effect = baseFeatEffect(document, document.name);

  effect.changes.push(
    {
      key: "flags.midi-qol.onUseMacroName",
      value: `ItemMacro.${document.name},postDamageRoll`,
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: 20,
    },
  );
  effect.transfer = true;

  setProperty(effect, "flags.dae.transfer", true);
  document.effects.push(effect);

  await commonPiercer(document);
  return document;
}
