/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class HoundOfIllOmen extends DDBEnricherData {

  get type() {
    return "summon";
  }

  get activity() {
    return {
      noTemplate: true,
      profileKeys: ["HoundOfIllOmen"],
      summons: {
        "creatureSizes": ["med"],
        "creatureTypes": ["monstrosity"],
        "bonuses.hp": "floor(@classes.sorcerer.levels / 2)",
      },
    };
  }

  get effects() {
    return [];
  }

}
