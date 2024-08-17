import DDBBasicActivity from "../../parser/enrichers/DDBBasicActivity.js";
import { baseFeatEffect } from "../specialFeats.js";

export function holdBreathEffect(document, character) {
  // const effect = baseFeatEffect(document, document.name);

  // // const activityId = DDBBasicActivity.createActivity({
  // //   name: document.name,
  // //   document,
  // //   type: "utility",
  // //   character: character,
  // // });
  // console.warn(document);
  // effect.duration.rounds = 600;
  // // document.system.activities[activityId].target.affects.type = "self";
  // // document.system.activities[activityId].range = {
  // //   value: null,
  // //   units: "self",
  // //   special: "",
  // // };
  // document.effects.push(effect);

  // foundry.utils.setProperty(document, "flags.midiProperties.toggleEffect", true);

  // // document.system.activities[activityId].activation = {
  // //   type: "special",
  // //   value: 1,
  // //   condition: "",
  // // };

  // if (document.name === "Partially Amphibious") {
  //   document.system.uses = {
  //     spent: 0,
  //     max: "1",
  //     recovery: [{
  //       period: "lr",
  //       type: "recoverAll",
  //     }],
  //   };
  // }

  return document;
}
