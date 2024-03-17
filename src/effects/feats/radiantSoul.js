import { baseFeatEffect } from "../specialFeats.js";
import DDBMacros from "../DDBMacros.js";

export async function radiantSoulEffect(document) {

  if (document.flags.ddbimporter.type == "race") {
    let effect = baseFeatEffect(document, document.name);

    effect.changes.push(
      {
        key: "data.attributes.movement.fly",
        mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
        value: "30",
        priority: "20",
      },
      {
        key: "flags.midi-qol.optional.radiantsoul.label",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: `${document.name} Bonus Damage`,
        priority: "20",
      },
      {
        key: "flags.midi-qol.optional.radiantsoul.count",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: "each-round",
        priority: "20",
      },
      {
        key: "flags.midi-qol.optional.radiantsoul.damage.all",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
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
    let effect = baseFeatEffect(document, document.name, { transfer: true });
    effect.changes.push(
      {
        key: "flags.dnd5e.DamageBonusMacro",
        value: DDBMacros.generateItemMacroValue({ macroType: "feat", macroName: "radiantSoul.js", document }),
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        priority: "20",
      },
    );

    await DDBMacros.setItemMacroFlag(document, "feat", "radiantSoul.js");
    foundry.utils.setProperty(document, "system.activation.type", "special");

    document.effects.push(effect);
  }

  return document;
}
