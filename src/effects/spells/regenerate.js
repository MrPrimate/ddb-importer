import { baseSpellEffect } from "../specialSpells.js";

export function regenerateEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.midi-qol.OverTime",
      mode: 5,
      value: `label=${document.name} (Start of Turn),killAnim=true,turn=end,damageRoll=1,damageType=healing,condition=@attributes.hp.value > 0 && @attributes.hp.value < @attributes.hp.max`,
      priority: "20",
    }
  );
  document.effects.push(effect);

  return document;
}
