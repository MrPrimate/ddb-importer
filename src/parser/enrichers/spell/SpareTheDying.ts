import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Spare the Dying: the creature at 0 hit points becomes Stable.
 */
export default class SpareTheDying extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Stabilized",
        statuses: ["Stable"],
        options: {
          durationSeconds: null,
        },
      },
    ];
  }

}
