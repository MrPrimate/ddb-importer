/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class PrimalCompanionRestoreBeast extends DDBEnricherMixin {

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
