/* eslint-disable no-await-in-loop */
import { forceItemEffect, addStatusEffectChange } from "../effects.js";
import { baseMonsterFeatureEffect } from "../specialMonsters.js";


export function giantSpiderEffects(npc) {
  for (let item of npc.items) {
    if (item.name.startsWith("Web")) {
      let effect = baseMonsterFeatureEffect(item, item.name);
      addStatusEffectChange(effect, "Restrained", 20, true);
      effect.changes.push(
        {
          key: "flags.midi-qol.OverTime",
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          value: "turn=start,name=You can take an action to break free of the web by rolling a Strength Ability Check",
          priority: "20",
        },
        {
          key: "flags.midi-qol.OverTime",
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          value: "turn=end, rollType=check, actionSave=true, saveAbility=str, saveDC=@abilities.str.dc, label=Restrained by Web",
          priority: "20",
        },
      );

      foundry.utils.setProperty(effect, "duration.seconds", 60);
      foundry.utils.setProperty(effect, "duration.rounds", 10);
      foundry.utils.setProperty(effect, "flags.dae.stackable", "noneName");

      item.effects.push(effect);
      item = forceItemEffect(item);
    }
  }

  return npc;
}

