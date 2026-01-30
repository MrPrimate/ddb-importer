/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class OttosIrresistableDance extends DDBEnricherData {

  get type() {
    return "cast";
  }

  get activity() {
    return {
      addSpellUuid: "Otto's Irresistible Dance",
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }

}
