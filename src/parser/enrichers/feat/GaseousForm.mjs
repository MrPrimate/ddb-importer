/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class GaseousForm extends DDBEnricherData {

  get type() {
    return "none";
  }

  // get type() {
  //   return "cast";
  // }

  // get activity() {
  //   return {
  //     addSpellUuid: "Gaseous Form",
  //     data: {
  //       spell: {
  //         spellbook: false,
  //       },
  //     },
  //   };
  // }

}
