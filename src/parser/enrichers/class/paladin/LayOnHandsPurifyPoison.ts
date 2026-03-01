import DDBEnricherData from "../../data/DDBEnricherData";

export default class LayOnHandsPurifyPoison extends DDBEnricherData {

  get activity() {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      addItemConsume: true,
      itemConsumeValue: "5",
    };
  }

}
