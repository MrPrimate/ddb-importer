import { DDBBasicActivity } from "../../parser/features/DDBBasicActivity.js";
import { baseFeatEffect } from "../specialFeats.js";

export function holdBreathEffect(document) {
  const effect = baseFeatEffect(document, document.name);

  const activityId = DDBBasicActivity.createActivity( {
    document,
    type: "utility",
  });
  console.warn(document);
  effect.duration.rounds = 600;
  document.activities[activityId].target.affects.type = "self";
  document.activities[activityId].range = {
    value: null,
    units: "self",
    special: "",
  };
  document.effects.push(effect);

  foundry.utils.setProperty(document, "flags.midiProperties.toggleEffect", true);

  document.activities[activityId].activation = {
    type: "special",
    value: 1,
    condition: "",
  };

  if (document.name === "Partially Amphibious") {
    document.system.uses = {
      spent: 0,
      max: "1",
      recovery: [{
        period: "lr",
        type: "recoverAll",
      }],
    };
  }

  return document;
}
