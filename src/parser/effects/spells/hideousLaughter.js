import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function hideousLaughterEffect(document) {
  let effectHideousLaughterHideousLaughter = baseSpellEffect(document, document.name);
  effectHideousLaughterHideousLaughter.changes.push(
    generateStatusEffectChange("Incapacitated"),
    generateStatusEffectChange("Prone")
  );
  effectHideousLaughterHideousLaughter.changes.push({
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    value: "turn=end, saveDc = @attributes.spelldc, saveAbility = wis, savingThrow=true",
    priority: "20",
  });
  document.effects.push(effectHideousLaughterHideousLaughter);

  return document;
}
