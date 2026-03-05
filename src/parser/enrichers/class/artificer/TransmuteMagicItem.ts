import DDBEnricherData from "../../data/DDBEnricherData";

export default class TransmuteMagicItem extends DDBEnricherData {

  get activity(): IDDBActivityData {
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
