import DDBEnricherData from "../data/DDBEnricherData";

/**
 * A single use activity; the extra attacks come at the cost of accuracy, so the
 * penalty is an effect that lapses at the end of the current turn.
 */
export default class SprayNPray extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      activationType: "bonus",
      targetType: "self",
      rangeSelf: true,
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Spray 'n' Pray: 2 Attacks",
        options: {
          durationSeconds: 6,
          durationRounds: 1,
        },
        daeSpecialDurations: ["turnEnd"],
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("-5", 20, "system.bonuses.rwak.attack"),
        ],
      },
    ];
  }

}
