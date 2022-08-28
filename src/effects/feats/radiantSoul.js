import { baseFeatEffect } from "../specialFeats.js";

export function radiantSoulEffect(document) {
  console.warn(document);
  if (document.flags.obsidian.source.type == "race") {
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

    document.data["target"]["type"] = "self";
    document.data.range = { value: null, units: "self", long: null };
    document.data.actionType = "other";

  }

  return document;
}
