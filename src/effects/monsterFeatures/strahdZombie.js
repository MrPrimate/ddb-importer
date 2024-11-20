import { forceItemEffect } from "../effects.js";
import DDBMacros from "../DDBMacros.mjs";
import { baseMonsterFeatureEffect } from "../specialMonsters.js";


export async function strahdZombieEffects(npc) {
  for (let item of npc.items) {
    if (item.name.startsWith("Loathsome Limbs")) {
      let effect = baseMonsterFeatureEffect(item, item.name);
      effect.changes.push(
        DDBMacros.generateOnUseMacroChange({ macroPass: "isDamaged", macroType: "monsterFeature", macroName: "loathsomeLimbs.js" }),
      );
      effect.transfer = true;
      foundry.utils.setProperty(effect, "flags.dae.stackable", "noneName");
      await DDBMacros.setItemMacroFlag(item, "monsterFeature", "loathsomeLimbs.js");

      item.effects.push(effect);
    }
    item = forceItemEffect(item);
  }

  return npc;
}
