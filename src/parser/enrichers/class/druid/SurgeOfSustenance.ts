import Generic from "../Generic";

/** Circle of the Symbiote: spends a Wild Shape use and the feature's own once-per-long-rest use. */
export default class SurgeOfSustenance extends Generic {

  override get activity(): IDDBActivityData | null {
    // the same-named DDB action carries the activity; the feature itself adds none
    if (!this.isAction) return null;
    return {
      addItemConsume: true,
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "feat:wild-shape",
          value: "1",
          scaling: { mode: "", formula: "" },
        },
      ],
    };
  }

}
