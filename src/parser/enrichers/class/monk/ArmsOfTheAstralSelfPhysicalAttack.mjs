/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ArmsOfTheAstralSelfPhysicalAttack extends DDBEnricherData {

  get activity() {
    return {
      data: {
        "attack.ability": "",
      },
    };
  }

  get override() {
    return {
      data: {
        name: "Arms of the Astral Self",
      },
    };
  }

}
