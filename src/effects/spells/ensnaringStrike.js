import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";
import { addStatusEffectChange, effectModules } from "../effects.js";

export async function ensnaringStrikeEffect(document) {
  if (effectModules().midiQolInstalled) {
    let effect = baseSpellEffect(document, document.name);
    await DDBMacros.setItemMacroFlag(document, "spell", "ensnaringStrike.js");
    effect.changes.push(
      DDBMacros.generateOnUseMacroChange({ macroPass: "postActiveEffects", macroType: "spell", macroName: "ensnaringStrike.js", document }),
    );
    foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
    foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);

    document.effects.push(effect);
    document.system.damage = { parts: [], versatile: "", value: "" };
    document.system.actionType = null;
    document.system.save.ability = "";
    DDBMacros.setMidiOnUseMacroFlag(document, "spell", "ensnaringStrike.js", ["preTargeting"]);
  } else {
    let effect = baseSpellEffect(document, `${document.name} - Restrained`);
    addStatusEffectChange(effect, "Restrained", 20, true);
    document.effects.push(effect);
  }

  return document;
}
