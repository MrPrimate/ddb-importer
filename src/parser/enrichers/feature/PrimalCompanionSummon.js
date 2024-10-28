/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class PrimalCompanionSummon extends DDBEnricherMixin {

  get activity() {
    return {
      name: "Summon After Long Rest",
      type: "summon",
      activationType: "special",
      activationCondition: "After a Long Rest",
      addActivityConsume: true,
      data: {
        uses: {
          spent: 0,
          max: 1,
          override: true,
          recovery: [
            { period: "lr", type: 'recoverAll', formula: undefined },
          ],
        },
      },
    };
  }

}
