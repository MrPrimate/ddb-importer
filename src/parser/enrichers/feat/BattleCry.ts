import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Thunderous Cry: the Intimidation check sets the Wisdom save DC for up to one, two (9th level) or
 * three (15th level, range 60 feet) creatures, which are Frightened for 1d4 rounds on a failure.
 * The DC is the check result, so the activity rolls the check and the save is made against it by hand.
 */
export default class BattleCry extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Thunderous Cry",
      activationType: "bonus",
      addItemConsume: true,
      data: {
        range: { override: true, value: "30 + 30 * floor(@details.level / 15)", units: "ft" },
        target: {
          override: true,
          affects: { type: "creature", count: "1 + floor((@details.level + 6) / 15) + floor(@details.level / 15)", choice: true },
        },
        roll: { prompt: false, visible: true, formula: "1d20 + @skills.itm.total", name: "Intimidation check (sets the Wisdom save DC)" },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Frightened",
        statuses: ["frightened"],
        options: { durationSeconds: 24, description: "Frightened for 1d4 rounds; repeats the save at the end of each of its turns." },
      },
    ];
  }

}
