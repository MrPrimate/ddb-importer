import DDBEnricherData from "../../data/DDBEnricherData";

export default class HarnessDivinePower extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      activationType: "bonus",
      addItemConsume: true,
    };
  }

  get override() {
    return {
      retainOriginalConsumption: true,
    };
  }

}
