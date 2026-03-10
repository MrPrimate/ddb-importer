import { DICTIONARY } from "../config/_module";
import { generateOverrideChange } from "./effects";

function buildBaseOverrideEffect(label): IEffectData {
  const effect: IEffectData = {
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
    img: "icons/svg/anchor.svg",
    flags: {
      dae: { transfer: true },
      ddbimporter: { disabled: false, itemId: null, entityTypeId: null },
    },
  };
  effect.name = label;
  return effect;
}


export function abilityOverrideEffect(overrides): IEffectData {
  const effect = buildBaseOverrideEffect("Ability Overrides");

  DICTIONARY.actor.abilities.forEach((ability) => {
    if (overrides[ability.value] === 0) return;
    effect.changes.push(generateOverrideChange(overrides[ability.value], 50, `system.abilities.${ability.value}.value`));
  });

  return effect;
}
