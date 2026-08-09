import DDBEnricherData from "../../data/DDBEnricherData";

export default class CallOfTheShadowseeds extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Summon Blighted Sapling",
      addItemConsume: true,
      noTemplate: true,
    };
  }

}
