import { baseFeatEffect } from "../specialFeats.js";

export function pactMagicEffect(document) {

  if (foundry.utils.getProperty(document, "flags.ddbimporter.subclass")?.startsWith("Order of the Profane Soul")) {
    const effect = baseFeatEffect(document, `${document.name} Level`, { transfer: true });
    effect.changes.push(
      {
        key: "system.spells.pact.level",
        value: "@scale.order-of-the-profane-soul.pact-level",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        priority: "20",
      },
    );
    document.effects.push(effect);

  }

  return document;
}


