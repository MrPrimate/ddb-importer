/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ClawsDexterity extends DDBEnricherData {
  get type() {
    return "attack";
  }

  get activity() {
    return {
      data: {
        attack: {
          ability: "dex",
        },
      },
    };
  }

}
