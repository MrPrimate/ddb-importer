/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PlanarWarrior extends DDBEnricherData {

  get addAutoAdditionalActivities() {
    return true;
  }

  // Planar Warrior Macro needs rewriting for D&D 4.x
  // get effects() {
  //   return [
  //     {
  //       midiOnly: true,
  //       name: "Marked by Planar Warrior",
  //       options: {
  //         durationTurns: 1,
  //       },
  //     },
  //   ];
  // }

  // get setMidiOnUseMacroFlag() {
  //   return {
  //     type: "feat",
  //     name: "planarWarrior.js",
  //     triggerPoints: ["preTargeting"],
  //   };
  // }

  // get itemMacro() {
  //   return {
  //     type: "feat",
  //     name: "planarWarrior.js",
  //   };
  // }

}
