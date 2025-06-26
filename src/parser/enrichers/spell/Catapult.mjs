/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Catapult extends DDBEnricherData {

  get activity() {
    return {
      data: {
        damage: {
          onSave: "none",
        },
      },
    };
  }

}
