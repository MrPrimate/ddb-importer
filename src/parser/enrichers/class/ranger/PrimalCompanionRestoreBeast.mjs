/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PrimalCompanionRestoreBeast extends DDBEnricherData {

  get activity() {
    return {
      name: "Restore Beast",
      type: "summon",
      activationType: "action",
      activationCondition: "Takes 1 minute to be restored to life",
      addSpellSlotConsume: true,
      addSpellSlotScalingMode: "level",
    };
  }

}
