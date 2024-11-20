import { effectModules } from "../effects.js";
// import DDBMacros from "../DDBMacros.mjs";

export async function chillTouchEffect(document) {
  if (effectModules().midiQolInstalled) {
    document.effect[0].changes.push(
      {
        key: "flags.midi-qol.onUseMacroName",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: `function.DDBImporter.lib.DDBMacros.macroFunction.spell("chillTouchDisadvantage"),preAttackRoll`,
        // value: "Chill Touch (Target effect),preAttackRoll",
        priority: "30",
      },
    );
    // const itemMacroText = await DDBMacros.loadMacroFile("spell", "chillTouch.js");
    // document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
    // effect.changes.push(DDBMacros.generateMacroChange());
    foundry.utils.setProperty(document.effect[0], "flags.dae.specialDuration", ["turnEndSource"]);
  }

  return document;
}
