import { baseFeatEffect } from "../specialFeats.js";

export function armsOfTheAstralSelfEffect(document) {

  let effect = baseFeatEffect(document, `${document.name} (Save Modifications)`);

  effect.changes.push(
    {
      key: "system.abilities.str.bonuses.check",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "- @abilities.str.mod + @abilities.wis.mod",
      priority: "5",
    },
    {
      key: "system.abilities.str.bonuses.save",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "- @abilities.str.mod + @abilities.wis.mod",
      priority: "5",
    },
  );

  foundry.utils.setProperty(effect, "duration.seconds", 600);

  document.effects.push(effect);
  return document;
}
