import DDBEnricherData from "../../data/DDBEnricherData";

export default class CallOfTheShadowseeds extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Summon Blighted Sapling",
      addItemConsume: true,
      noTemplate: true,
    };
  }

}
