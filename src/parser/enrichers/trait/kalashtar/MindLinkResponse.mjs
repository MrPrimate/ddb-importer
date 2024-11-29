/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class MindLinkResponse extends DDBEnricherData {

  get activity() {
    return {
      data: {
        range: {
          units: "spec",
          special: "Withing sight",
        },
      },
    };
  }

}
