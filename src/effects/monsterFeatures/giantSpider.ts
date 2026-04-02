import { forceItemEffect, addStatusEffectChange } from "../effects";
import { baseMonsterFeatureEffect } from "../specialMonsters";


export function giantSpiderEffects(npc) {
  for (let item of npc.items) {
    if (item.name.startsWith("Web")) {
      const effect = baseMonsterFeatureEffect(item, item.name);
      addStatusEffectChange({ effect, statusName: "Restrained" });
      effect.system.changes.push(
        {
          key: "flags.midi-qol.OverTime",
          type: "custom",
          value: "turn=start,name=You can take an action to break free of the web by rolling a Strength Ability Check",
          priority: "20",
        },
        {
          key: "flags.midi-qol.OverTime",
          type: "custom",
          value: "turn=end, rollType=check, actionSave=true, saveAbility=str, saveDC=@abilities.str.dc, label=Restrained by Web",
          priority: "20",
        },
      );

      foundry.utils.setProperty(effect, "duration.value", 60);
      foundry.utils.setProperty(effect, "duration.units", "seconds");
      foundry.utils.setProperty(effect, "flags.dae.stackable", "noneNameOnly");

      item.effects.push(effect);
      item = forceItemEffect(item);
    }
  }

  return npc;
}

