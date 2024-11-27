/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Lineage extends DDBEnricherData {

  get type() {
    return "none";
  }

  get override() {
    return {
      data: {
        name: `${this.data.name}`.replace(/ Lineage$/i, ""),
      },
    };
  }

}
