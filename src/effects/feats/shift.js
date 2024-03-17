import parseTemplateString from "../../lib/DDBTemplateStrings.js";
import { baseFeatEffect } from "../specialFeats.js";

export function shiftEffect(ddb, character, document) {
  const isBeasthide = ddb.character.options.race.find((trait) => trait.definition.name === "Beasthide");
  const isSwiftstride = ddb.character.options.race.find((trait) => trait.definition.name === "Swiftstride");
  const isWildhunt = ddb.character.options.race.find((trait) => trait.definition.name === "Wildhunt");
  const isLongtooth = ddb.character.options.race.find((trait) => trait.definition.name === "Longtooth");

  let effect = baseFeatEffect(document, `${document.name}`);

  if (isBeasthide) {
    document.system.damage.parts[0][0] = `1d6 + ${document.system.damage.parts[0][0]}`;
    effect.changes.push(
      {
        key: "system.attributes.ac.bonus",
        value: "+ 1",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        priority: 20,
      },
    );
    foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
    foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);
    const description = parseTemplateString(ddb, character, isBeasthide.definition.description, isBeasthide.definition).text;
    document.system.description.value += `<h2>Beasthide</h2>\n${description}`;
    document.effects.push(effect);
  } else if (isSwiftstride) {
    effect.changes.push(
      {
        key: "system.attributes.movement.walk",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "+ 10",
        priority: "20",
      },
    );
    foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
    foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);
    const description = parseTemplateString(ddb, character, isSwiftstride.definition.description, isSwiftstride.definition).text;
    document.system.description.value += `<h2>Swiftstride</h2>\n${description}`;
    document.effects.push(effect);
  } else if (isWildhunt) {
    effect.changes.push(
      {
        key: "flags.midi-qol.advantage.ability.check.wis",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: "1",
        priority: "20",
      },
    );
    foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
    foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);
    const description = parseTemplateString(ddb, character, isWildhunt.definition.description, isWildhunt.definition).text;
    document.system.description.value += `<h2>Wildhunt</h2>\n${description}`;
    document.effects.push(effect);
  } else if (isLongtooth) {
    const description = parseTemplateString(ddb, character, isLongtooth.definition.description, isLongtooth.definition).text;
    document.system.description.value += `<h2>Longtooth</h2>\n${description}`;
  }

  return document;
}
