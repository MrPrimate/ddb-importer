/* eslint-disable no-await-in-loop */
import { generateStatusEffectChange } from "../effects.js";
import { baseMonsterFeatureEffect } from "../specialMonsters.js";


export function invisibilityFeatureEffect(document) {
  if (document.type === "spell") return document;

  let effect = baseMonsterFeatureEffect(document, `${document.name} feature`);
  effect.changes.push(
    generateStatusEffectChange("Invisible", 20, true)
  );
  setProperty(effect, "flags.dae.stackable", "noneName");

  const permanent = ["special"].includes(getProperty(document, "flags.monsterMunch.type"));
  const improvedEffect = ["Superior Invisibility"].includes(document.name);

  if (permanent) {
    effect.transfer = true;
  } else if (!improvedEffect) {
    setProperty(effect, "flags.dae.specialDuration", ["1Action", "1Spell", "1Attack"]);
  }
  document.effects.push(effect);

  document.system.actionType = "other";
  document.system["target"]["type"] = "self";
  document.system.range = { value: null, units: "self", long: null };
  document.system.duration.units = "spec";

  setProperty(document, "flags.midi-qol.forceCEOff", true);
  setProperty(document, "flags.midiProperties.concentration", true);

  return document;
}

