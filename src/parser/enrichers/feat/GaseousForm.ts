import DDBEnricherData from "../data/DDBEnricherData";

export default class GaseousForm extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  // get type() {
  //   return DDBEnricherData.ACTIVITY_TYPES.CAST;
  // }

  // get activity(): IDDBActivityData {
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
