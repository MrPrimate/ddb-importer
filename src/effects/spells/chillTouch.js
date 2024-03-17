import { effectModules } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";
// import DDBMacros from "../DDBMacros.js";

export async function chillTouchEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "system.traits.di.value",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "healing",
      priority: "30",
    },
  );
  if (effectModules().midiQolInstalled) {
    effect.changes.push(
      {
        key: "flags.midi-qol.onUseMacroName",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: "Chill Touch (Target effect),preAttackRoll",
        priority: "30",
      },
    );
    // const itemMacroText = await DDBMacros.loadMacroFile("spell", "chillTouch.js");
    // document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
    // effect.changes.push(DDBMacros.generateMacroChange());
    foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["turnEndSource"]);
  }
  document.effects.push(effect);

  return document;
}
