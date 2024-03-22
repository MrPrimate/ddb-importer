import { baseSpellEffect } from "../specialSpells.js";

export function alterSelfEffect(document) {
  let effectAquaticAdaptation = baseSpellEffect(document, document.name);
  effectAquaticAdaptation.changes.push({
    key: "system.attributes.movement.swim",
    value: "@attributes.movement.walk",
    mode: 4,
    priority: 20,
  });
  document.effects.push(effectAquaticAdaptation);

  let effectNaturalWeapons = baseSpellEffect(document, document.name);
  effectNaturalWeapons.changes.push(
    { key: "items.Unarmed Strike.system.damage.parts.0.0", value: "1d6+@mod+1", mode: 5, priority: 20 },
    { key: "items.Unarmed Strike.system.properties.mgc", value: "true", mode: 5, priority: 20 },
    { key: "items.Unarmed Strike.system.proficient", value: "true", mode: 5, priority: 20 },
    { key: "items.Unarmed Strike.system.attack.bonus", value: "1", mode: 2, priority: 20 }
  );
  document.effects.push(effectNaturalWeapons);

  return document;
}
