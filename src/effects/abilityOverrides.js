import DICTIONARY from "../dictionary.js";
import { generateOverrideChange } from "./effects.js";

function buildBaseOverrideEffect(label) {
  let effect = {
    changes: [],
    duration: {
      seconds: null,
      startTime: null,
      rounds: null,
      turns: null,
      startRound: null,
      startTurn: null,
    },
    origin: "Ability.Override",
    tint: "",
    disabled: false,
    transfer: true,
    selectedKey: [],
    icon: "icons/svg/anchor.svg",
    flags: {
      dae: { transfer: true },
      ddbimporter: { disabled: false, itemId: null, entityTypeId: null }
    },
  };
  effect.name = label;
  return effect;
}


export function abilityOverrideEffects(overrides) {
  let effects = buildBaseOverrideEffect("Ability Overrides");

  DICTIONARY.character.abilities.forEach((ability) => {
    if (overrides[ability.value] === 0) return;
    effects.changes.push(generateOverrideChange(overrides[ability.value], 50, `system.abilities.${ability.value}.value`));
  });

  return effects;
}
