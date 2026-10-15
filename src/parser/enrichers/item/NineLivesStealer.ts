import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Life Stealing spends one of the sword's charges (1d8 + 1, never regained, so the most it can
 * start with) only when the creature is slain, so the save is the activity that spends it.
 */
export default class NineLivesStealer extends DDBEnricherData {

  // the text's DC 15 Constitution save is the parsed activity; it is the one that spends a charge
  override get activity(): IDDBActivityData {
    return {
      name: "Life Stealing",
      activationType: "special",
      activationCondition: "You roll a 20 on an attack against a creature with fewer than 100 Hit Points",
      overrideActivation: true,
      addItemConsume: true,
      data: {
        target: { override: true, affects: { type: "creature", count: "1", choice: false, special: "" } },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Life Stolen",
        statuses: ["Dead"],
        activityMatch: "Life Stealing",
        options: { transfer: false, durationSeconds: null },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: { spent: 0, max: "9", recovery: [] },
    };
  }

}
