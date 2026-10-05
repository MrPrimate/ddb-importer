import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Free League Scholar: a bonus action grants a creature within 30 feet a Lore die (d6, d8 at 5th
 * level, d10 at 10th) to add to one check, attack or save within a minute. DDB's action resets on a
 * short rest; the text gives a long rest, which the import follows.
 */
export default class RhymesOfLore extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "bonus",
      addItemConsume: true,
      data: {
        range: { override: true, value: "30", units: "ft" },
        roll: {
          prompt: false,
          visible: true,
          formula: "1d(6 + 2 * min(1, floor(@classes.scholar.levels / 5)) + 2 * min(1, floor(@classes.scholar.levels / 10)))",
          name: "Lore Die",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Lore Die",
        options: {
          durationSeconds: 60,
          description: "Once within the next minute, roll the Lore die and add it to one ability check, attack roll, or saving throw, after seeing the d20 but before the outcome is known.",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Rhymes of Lore",
        max: "max(1, @abilities.int.mod)",
        period: "lr",
      }),
    };
  }

}
