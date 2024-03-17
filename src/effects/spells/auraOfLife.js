/* eslint-disable require-atomic-updates */
import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";
import { effectModules } from "../effects.js";

export async function auraOfLifeEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "system.traits.dr.value",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "necrotic",
      priority: "20",
    },
    // {
    //   key: "flags.midi-qol.OverTime",
    //   mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    //   value: "turn=start,label=Aura of Life (Start of Turn),damageRoll=1,damageType=heal,killAnim=true,applyCondition=##attributes.hp.value <= 0",
    //   priority: "20",
    // }
  );

  if (effectModules().midiQolInstalled) {
    await DDBMacros.setItemMacroFlag(document, "spell", "auraOfLife.js");
    effect.flags["ActiveAuras"] = {
      isAura: true,
      aura: "Allies",
      radius: 30,
      alignment: "",
      type: "",
      ignoreSelf: false,
      height: false,
      hidden: false,
      onlyOnce: false,
      save: false,
      savedc: null,
      displayTemp: true,
    };
    // foundry.utils.setProperty(effect, "duration.seconds", 600);
    foundry.utils.setProperty(effect, "flags.dae.macroRepeat", "startEveryTurn");
    effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@token", macroType: "spell", macroName: "auraOfLife.js" }));
    document.system.actionType = "other";
    document.system.damage.parts = [];
    document.system.range = { value: null, units: "self", long: null };
    document.system['target']['type'] = "self";
  }

  document.effects.push(effect);
  return document;

}
