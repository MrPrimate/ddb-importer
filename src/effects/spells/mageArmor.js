import { baseSpellEffect } from "../specialSpells.js";

export function mageArmorEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  // we use base here as it stacks better with other ac effects rather than the default mage calc
  effect.changes.push({
    key: "data.attributes.ac.base",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    value: "13",
    priority: "5",
  });
  // effect.changes.push({
  //   key: "data.attributes.ac.calc",
  //   mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
  //   value: "mage",
  //   priority: "5",
  // });
  document.effects.push(effect);

  return document;
}
