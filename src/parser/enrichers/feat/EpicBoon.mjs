/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class EpicBoon extends DDBEnricherData {

  get override() {
    return {
      data: {
        "name": "Epic Boon",
      },
    };
  }

}
