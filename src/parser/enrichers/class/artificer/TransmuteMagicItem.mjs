/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class TransmuteMagicItem extends DDBEnricherData {

  get activity() {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Transmute Magic Item",
    });
    return {
      noConsumeTargets: true,
      addActivityConsume: true,
      data: {
        uses,
      },
    };
  }

}
