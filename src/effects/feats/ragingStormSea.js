import { addStatusEffectChange } from "../effects.js";
import { baseFeatEffect } from "../specialFeats.js";
import DDBMacros from "../DDBMacros.js";

export async function ragingStormSeaEffect(document) {

  await DDBMacros.setItemMacroFlag(document, "feat", "ragingStormSea.js");

  const effect = baseFeatEffect(document, document.name);
  addStatusEffectChange(effect, "Prone", 20, true);
  document.effects.push(effect);

  const evaluationEffect = baseFeatEffect(document, `${document.name} (Trigger Checker)`, { transfer: true });

  evaluationEffect.changes.push(
    DDBMacros.generateOptionalMacroChange({ optionPostfix: "ragingSea.damage.mwak", macroType: "feat", macroName: "ragingStormSea.js", document }),
    DDBMacros.generateOptionalMacroChange({ optionPostfix: "ragingSea.damage.msak", macroType: "feat", macroName: "ragingStormSea.js", document }),
    DDBMacros.generateOptionalMacroChange({ optionPostfix: "ragingSea.damage.rwak", macroType: "feat", macroName: "ragingStormSea.js", document }),
    DDBMacros.generateOptionalMacroChange({ optionPostfix: "ragingSea.damage.rsak", macroType: "feat", macroName: "ragingStormSea.js", document }),
    {
      key: "flags.midi-qol.optional.ragingSea.count",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "reaction",
      priority: "20",
    },
    {
      key: "flags.midi-qol.optional.ragingSea.label",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "Use your reaction to induce a save to apply prone?",
      priority: "20",
    },
  );
  document.effects.push(evaluationEffect);
  return document;
}
