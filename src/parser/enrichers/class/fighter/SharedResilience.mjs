/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SharedResilience extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      addItemConsume: true,
      activationType: "reaction",
      activationCondition: "An ally in range fails a saving throw",
      itemConsumeTargetName: "Indomitable",
    };
  }

}
