import { baseSpellEffect } from "../specialSpells.js";

export function guidingBoltEffect(document) {
  let effectGuidingBoltGuidingBolt = baseSpellEffect(document, document.name);
  effectGuidingBoltGuidingBolt.changes.push({
    key: "flags.midi-qol.grants.advantage.attack.all",
    value: "1",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    priority: 20,
  });
  document.effects.push(effectGuidingBoltGuidingBolt);

  return document;
}
