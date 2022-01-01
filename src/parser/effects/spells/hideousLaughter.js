import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function hideousLaughterEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    generateStatusEffectChange("Incapacitated"),
    generateStatusEffectChange("Prone")
  );
  effect.changes.push({
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    value: "turn=end, saveDc = @attributes.spelldc, saveAbility = wis, savingThrow=true",
    priority: "20",
  });
  document.effects.push(effect);

  return document;
}
