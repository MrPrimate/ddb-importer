import { forceItemEffect, addStatusEffectChange } from "../effects";
import { baseMonsterFeatureEffect } from "../specialMonsters";


export function quasitEffects(npc) {
  for (let item of npc.items) {
    if (item.name.startsWith("Claws")) {
      const effect = baseMonsterFeatureEffect(item, item.name);
      effect.system.changes.push(
        {
          key: "flags.midi-qol.OverTime",
          type: "custom",
          value: "turn=end, saveAbility=con, saveDC=@abilities.con.dc, label=Poisoned by Quasit Claws",
          priority: "20",
        },
      );
      addStatusEffectChange({ effect, statusName: "Poisoned" });

      foundry.utils.setProperty(effect, "duration.value", 60);
      foundry.utils.setProperty(effect, "duration.units", "seconds");
      foundry.utils.setProperty(effect, "flags.dae.stackable", "noneNameOnly");

      item.effects.push(effect);
      foundry.utils.setProperty(item, "flags.midiProperties.fulldam", true);
      item = forceItemEffect(item);
    }
  }

  return npc;
}

