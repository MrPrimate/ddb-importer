import { DICTIONARY } from "../config/_module";
import { generateOverrideChange } from "./effects";

function buildBaseOverrideEffect(label): I5eEffectData {
  const effect: I5eEffectData = {
    system: {
      changes: [],
    },
    duration: {},
    origin: "Ability.Override",
    tint: "",
    disabled: false,
    transfer: true,
    img: "icons/svg/anchor.svg",
    flags: {
      dae: { transfer: true },
      ddbimporter: { disabled: false, itemId: null, entityTypeId: null },
    },
  };
  effect.name = label;
  return effect;
}


export function abilityOverrideEffect(overrides): I5eEffectData {
  const effect = buildBaseOverrideEffect("Ability Overrides");

  DICTIONARY.actor.abilities.forEach((ability) => {
    if (overrides[ability.value] === 0) return;
    effect.system.changes.push(generateOverrideChange(overrides[ability.value], 50, `system.abilities.${ability.value}.value`));
  });

  return effect;
}
