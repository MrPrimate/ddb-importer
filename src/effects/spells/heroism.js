import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function heroismEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "system.traits.ci.value",
      value: "frightened",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: 20,
    },
    {
      key: "flags.midi-qol.OverTime",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: `turn=start,damageRoll=@attributes.spellmod,damageType=temphp,label=${document.name} Renewal,fastForwardDamage=true`,
      priority: 20,
    },
  );
  await DDBMacros.setItemMacroFlag(document, "spell", "heroism.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "heroism.js" }));
  document.effects.push(effect);
  document.system.damage.parts = [];

  return document;
}
