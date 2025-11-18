/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class CallOfTheShadowseeds extends DDBEnricherData {

  get type() {
    return "summon";
  }

  get activity() {
    return {
      name: "Summon Blighted Sapling",
      addItemConsume: true,
      noTemplate: true,
    };
  }

}
