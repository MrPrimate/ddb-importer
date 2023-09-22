import { baseFeatEffect } from "../specialFeats.js";
import DDBMacros from "../macros.js";

export async function radiantSoulEffect(document) {

  if (document.flags.ddbimporter.type == "race") {
    let effect = baseFeatEffect(document, document.name);

    effect.changes.push(
      {
        key: "data.attributes.movement.fly",
        mode: 4,
        value: "30",
        priority: "20",
      },
      {
        key: "flags.midi-qol.optional.radiantsoul.label",
        mode: 0,
        value: `${document.name} Bonus Damage`,
        priority: "20",
      },
      {
        key: "flags.midi-qol.optional.radiantsoul.count",
        mode: 0,
        value: "each-round",
        priority: "20",
      },
      {
        key: "flags.midi-qol.optional.radiantsoul.damage.all",
        mode: 0,
        value: document.name === "Celestial Revelation (Radiant Soul)" ? "+@prof[radiant]" : "+@details.level[radiant]",
        priority: "20",
      }
    );
    effect.duration = {
      startTime: null,
      seconds: null,
      rounds: 10,
      turns: null,
      startRound: null,
      startTurn: null,
    };

    document.effects.push(effect);

    document.system["target"]["type"] = "self";
    document.system.range = { value: null, units: "self", long: null };
    document.system.actionType = "other";

  } else if (document.flags.ddbimporter.type == "class") {
    let effect = baseFeatEffect(document, document.name);
    effect.changes.push(
      {
        key: "flags.dnd5e.DamageBonusMacro",
        value: `ItemMacro.${document.name}`,
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        priority: "20",
      },
    );
    effect.transfer = true;

    await DDBMacros.setItemMacroFlag(document, "feat", "radiantSoul.js");
    setProperty(document, "system.activation.type", "special");

    document.effects.push(effect);
  }

  return document;
}
