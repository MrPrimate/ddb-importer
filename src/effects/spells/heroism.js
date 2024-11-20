import DDBMacros from "../DDBMacros.mjs";
import { effectModules } from "../effects.js";

export async function heroismEffect(document) {
  if (effectModules().midiQolInstalled) {
    document.effects[0].changes.push(
      {
        key: "flags.midi-qol.OverTime",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: `turn=start,damageRoll=@attributes.spellmod,damageType=temphp,label=${document.name} Renewal,fastForwardDamage=true`,
        priority: 20,
      },
    );
    await DDBMacros.setItemMacroFlag(document, "spell", "heroism.js");
    document.effects[0].changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "heroism.js" }));
  }
  return document;
}
