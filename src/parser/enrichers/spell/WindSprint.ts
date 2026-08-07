import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Parses as an attack from the description wording; it is a self buff that adds
 * a one-off damage rider to the next hit.
 */
export default class WindSprint extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      rangeSelf: true,
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Wind Sprint",
        ac5eOnly: true,
        options: {
          durationSeconds: 6,
          durationRounds: 1,
        },
        daeSpecialDurations: ["turnEnd"],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.addChange(
            "bonus=1d6; addTo=base,types(slashing); cadence=once",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
