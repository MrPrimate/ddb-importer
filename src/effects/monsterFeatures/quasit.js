/* eslint-disable no-await-in-loop */
import { forceItemEffect, addStatusEffectChange } from "../effects.js";
import { baseMonsterFeatureEffect } from "../specialMonsters.js";


export function quasitEffects(npc) {
  for (let item of npc.items) {
    if (item.name.startsWith("Claws")) {
      let effect = baseMonsterFeatureEffect(item, item.name);
      effect.changes.push(
        {
          key: "flags.midi-qol.OverTime",
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          value: "turn=end, saveAbility=con, saveDC=@abilities.con.dc, label=Poisoned by Quasit Claws",
          priority: "20",
        },
      );
      addStatusEffectChange(effect, "Poisoned", 20, true);

      foundry.utils.setProperty(effect, "duration.seconds", 60);
      foundry.utils.setProperty(effect, "duration.rounds", 10);
      foundry.utils.setProperty(effect, "flags.dae.stackable", "noneName");

      item.effects.push(effect);
      foundry.utils.setProperty(item, "flags.midiProperties.fulldam", true);
      item = forceItemEffect(item);
    }
  }

  return npc;
}

