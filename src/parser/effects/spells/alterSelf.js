import { baseSpellEffect } from "../specialSpells.js";

export function alterSelfEffect(document) {
  let effectAlterSelfAquaticAdaptation = baseSpellEffect(document, document.name);
  effectAlterSelfAquaticAdaptation.changes.push({
    key: "data.attributes.movement.swim",
    value: "@attributes.movement.walk",
    mode: 4,
    priority: 20,
  });
  document.effects.push(effectAlterSelfAquaticAdaptation);

  let effectAlterSelfNaturalWeapons = baseSpellEffect(document, document.name);
  effectAlterSelfNaturalWeapons.changes.push(
    { key: "items.Unarmed Strike.data.damage.parts.0.0", value: "1d6+@mod+1", mode: 5, priority: 20 },
    { key: "items.Unarmed Strike.data.properties.mgc", value: "true", mode: 5, priority: 20 },
    { key: "items.Unarmed Strike.data.proficient", value: "true", mode: 5, priority: 20 },
    { key: "items.Unarmed Strike.data.attackBonus", value: "1", mode: 2, priority: 20 }
  );
  document.effects.push(effectAlterSelfNaturalWeapons);

  return document;
}
