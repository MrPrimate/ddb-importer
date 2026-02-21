import DDBEnricherData from "../../data/DDBEnricherData";

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
