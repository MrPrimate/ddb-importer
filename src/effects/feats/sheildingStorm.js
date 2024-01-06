import { baseFeatEffect } from "../specialFeats.js";

export function shieldingStormEffect(ddb, document) {

  const isDesert = ddb.character.actions.class.some((a) => a.name === "Storm Aura: Desert");
  const isSea = ddb.character.actions.class.some((a) => a.name === "Storm Aura: Sea");
  const isTundra = ddb.character.actions.class.some((a) => a.name === "Storm Aura: Tundra");

  const damageType = isDesert
    ? "fire"
    : isSea
      ? "lightning"
      : isTundra
        ? "cold"
        : "";

  let effect = baseFeatEffect(document, `${document.name} Aura`, { transfer: true });
  effect.changes.push({
    "key": "system.traits.dr.value",
    "mode": CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    "value": damageType,
    "priority": 20
  });

  effect.flags.ActiveAuras = {
    aura: "Allies",
    radius: "10",
    isAura: true,
    ignoreSelf: true,
    inactive: false,
    hidden: false,
    displayTemp: true,
  };

  document.effects.push(effect);

  return document;
}
