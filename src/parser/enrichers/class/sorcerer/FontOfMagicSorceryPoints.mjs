/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FontOfMagicSorceryPoints extends DDBEnricherData {

  get override() {
    return {
      data: {
        "name": "Sorcery Points",
      },
    };
  }

}
