import { forceItemEffect } from "../effects";
import { DDBMacros } from "../../lib/_module";
import { baseMonsterFeatureEffect } from "../specialMonsters";


export async function venomTrollEffects(npc) {
  for (let item of npc.items) {
    if (item.name === "Poison Splash") {
      const effect = baseMonsterFeatureEffect(item, item.name);
      effect.system.changes.push(
        DDBMacros.generateOnUseMacroChange({ macroPass: "isDamaged", macroType: "monsterFeature", macroName: "venomSpray.js" }),
      );
      effect.transfer = true;
      foundry.utils.setProperty(effect, "flags.dae.stackable", "noneNameOnly");
      await DDBMacros.setItemMacroFlag(item, "monsterFeature", "poisonSplash.js");
      item.effects.push(effect);

    } else if (item.name === "Regeneration") {
      const effect = baseMonsterFeatureEffect(item, item.name);
      effect.system.changes.push(
        {
          key: "flags.midi-qol.OverTime",
          type: "custom",
          value: `turn=start, damageRoll=${item.system.damage.parts[0][0]}, damageType=healing, condition=@attributes.hp.value > 0 && @attributes.hp.value < @attributes.hp.max, rollMode=gmroll, label=${item.name} (Fire or Acid prevents)`,
          priority: "20",
        },
      );
      foundry.utils.setProperty(effect, "flags.dae.transfer", true);
      effect.transfer = true;
      item.system.damage.parts = [];
      item.effects.push(effect);
    }
    item = forceItemEffect(item);
  }

  return npc;
}

