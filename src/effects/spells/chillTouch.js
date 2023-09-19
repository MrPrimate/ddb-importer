import { baseSpellEffect } from "../specialSpells.js";
// import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function chillTouchEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "system.traits.di.value",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "healing",
      priority: "30",
    },
    {
      key: "flags.midi-qol.onUseMacroName",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "Chill Touch (Target effect),preAttackRoll",
      priority: "30",
    },
  );
  // const itemMacroText = await loadMacroFile("spell", "chillTouch.js");
  // document = generateItemMacroFlag(document, itemMacroText);
  // effect.changes.push(generateMacroChange(""));
  setProperty(effect, "flags.dae.specialDuration", ["turnEndSource"]);
  document.effects.push(effect);

  return document;
}
