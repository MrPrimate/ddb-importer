import { baseItemEffect } from "../effects.js";

export function absorptionEffect(monster) {
  monster.items.forEach((item) => {
    const absRegEx = /is subjected to (\w+) damage, it takes no damage and instead regains a number of hit points equal to the (\w+) damage/;
    const match = absRegEx.exec(item.system.description.value);
    if (!item.effects) item.effects = [];
    if (match) {
      let effect = baseItemEffect(item, `${item.name}`);
      effect.changes.push(
        {
          key: `flags.midi-qol.absorption.${match[1]}`,
          value: "1",
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          priority: 20,
        }
      );
      effect.icon = "icons/svg/downgrade.svg";
      item.effects.push(effect);
    }
  });
  return monster;
}
