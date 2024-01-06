import { baseFeatEffect } from "../specialFeats.js";

export async function stormSoulEffect(ddb, document) {
  const isDesert = ddb.character.actions.class.some((a) => a.name === "Storm Aura: Desert");
  const isSea = ddb.character.actions.class.some((a) => a.name === "Storm Aura: Sea");
  const isTundra = ddb.character.actions.class.some((a) => a.name === "Storm Aura: Tundra");

  let effect = baseFeatEffect(document, `${document.name}`, { transfer: true });

  const damageType = isDesert
    ? "fire"
    : isSea
      ? "lightning"
      : isTundra
        ? "cold"
        : "";

  effect.changes.push(
    {
      key: "system.traits.dr.value",
      value: damageType,
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: 20,
    },
  );

  if (isSea) {
    effect.changes.push(
      {
        key: "system.attributes.movement.swim",
        value: "30",
        mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
        priority: 20,
      },
    );
  }

  document.effects.push(effect);

  return document;
}
