/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PsionicPowerRecovery extends DDBEnricherData {
  get activity() {
    return {
      name: "Recovery",
      addActivityConsume: true,
      addItemConsume: true,
      itemConsumeValue: "-1",
      data: {
        uses: this._getUsesWithSpent({
          type: "class",
          name: "Psionic Power: Recovery",
          max: 1,
          period: "lr",
        }),
      },
    };
  }
}
