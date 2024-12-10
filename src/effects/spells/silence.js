import { baseSpellEffect } from "../specialSpells.js";
import { DDBMacros } from "../../lib/_module.mjs";
import { addStatusEffectChange, effectModules } from "../effects.js";

export async function silenceEffect(document) {

  if (!effectModules().activeAurasInstalled) {
    let effect = baseSpellEffect(document, `${document.name} - Deafened`);
    addStatusEffectChange({ effect, statusName: "Deafened" });
    document.effects.push(effect);
    return document;
  }

  // if we have active auras use a more advanced macro
  await DDBMacros.setItemMacroFlag(document, "generic", "activeAuraOnly.js");

  let effect = baseSpellEffect(document, document.name);
  addStatusEffectChange({ effect, statusName: "Deafened" });
  effect.changes.push(
    {
      key: "flags.midi-qol.fail.spell.vocal",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "1",
      priority: "50",
    },
    {
      key: "system.traits.di.value",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "thunder",
      priority: "50",
    },
  );
  effect.flags["ActiveAuras"] = {
    isAura: true,
    aura: "All",
    radius: 20,
    alignment: "",
    type: "",
    ignoreSelf: false,
    height: false,
    hidden: false,
    // hostile: true,
    onlyOnce: false,
    save: "",
    savedc: null,
    displayTemp: true,
  };
  foundry.utils.setProperty(effect, "duration.seconds", 600);
  DDBMacros.setMidiOnUseMacroFlag(document, "generic", "activeAuraOnly.js", ["preActiveEffects"]);

  const limits = {
    sight: {
      hearing: { enabled: true, range: 0 }, // Hearing
    },
    sound: { enabled: true, range: 0 },
  };

  const walledtemplates = {
    wallRestriction: "move",
    wallsBlock: "walled",
  };

  foundry.utils.setProperty(document, "flags.limits", limits);
  foundry.utils.setProperty(document, "flags.walledtemplates", walledtemplates);

  document.effects.push(effect);

  return document;
}
