import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";
import { effectModules } from "../effects.js";

export async function fireShieldEffect(document) {
  if (effectModules().midiQolInstalled) {
    let effect = baseSpellEffect(document, document.name);
    await DDBMacros.setItemMacroFlag(document, "spell", "fireShield.js");
    effect.changes.push(
      DDBMacros.generateOnUseMacroChange({ macroPass: "isDamaged", macroType: "spell", macroName: "fireShield.js" }),
    );
    DDBMacros.setMidiOnUseMacroFlag(document, "spell", "fireShield.js", ["postActiveEffects"]);

    effect.duration.seconds = 600;
    effect.duration.rounds = 60;

    document.effects.push(effect);
    document.system.damage = { parts: [], versatile: "", value: "" };
    document.system.target.type = "self";
    foundry.utils.setProperty(document, "system.actionType", "util");

    foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);
  } else {
    let fireEffect = baseSpellEffect(document, "Cold Shield");
    fireEffect.changes.push({
      key: "system.traits.dr.value",
      value: "fire",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 0,
    });
    document.effects.push(fireEffect);
    let coldEffect = baseSpellEffect(document, "Warm Shield");
    coldEffect.changes.push({
      key: "system.traits.dr.value",
      value: "cold",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 0,
    });
    document.effects.push(coldEffect);
  }
  return document;
}
