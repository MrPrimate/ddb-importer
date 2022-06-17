import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function auraOfLifeEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "data.traits.dr.value",
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

  const itemMacroText = await loadMacroFile("spell", "auraOfLife.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
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
  // setProperty(effect, "duration.seconds", 600);
  setProperty(effect, "flags.dae.macroRepeat", "startEveryTurn");
  effect.changes.push(generateMacroChange("@token"));
  document.data.actionType = "other";
  document.data.damage.parts = [];
  document.data.range = { value: null, units: "self", long: null };
  document.data['target']['type'] = "self";

  document.effects.push(effect);
  return document;

}
