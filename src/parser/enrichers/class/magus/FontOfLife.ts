import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Sylvan Circle level 14. A Bonus Action manifests a 15 foot Emanation for a minute, once per Long
 * Rest: chosen creatures inside regain 1d8 + Intelligence modifier (minimum 1) Hit Points when it
 * appears and at the start of each of the magus's turns, and have Advantage on saving throws while
 * inside. Use the activity again (without spending the use) for each later turn's healing.
 */
export default class FontOfLife extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Manifest Font of Life",
      activationType: "bonus",
      addItemConsume: true,
      targetType: "creature",
      data: {
        range: { units: "self" },
        duration: { value: "1", units: "minute" },
        target: {
          template: { type: "radius", size: "15", units: "ft", contiguous: false, count: "", width: "", height: "" },
          affects: { type: "creature", choice: true, count: "", special: "" },
        },
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 8,
          bonus: "max(1, @abilities.int.mod)",
          types: ["healing"],
          scalingMode: "none",
        }),
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Turn Start Healing",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateHealing: true,
          activationOverride: { type: "special", value: null, condition: "Start of each of your turns while the Emanation lasts" },
          healingPart: DDBEnricherData.basicDamagePart({
            number: 1,
            denomination: 8,
            bonus: "max(1, @abilities.int.mod)",
            types: ["healing"],
            scalingMode: "none",
          }),
        },
        overrides: {
          targetType: "creature",
          noConsumeTargets: true,
          noTemplate: true,
          data: {
            range: { units: "spec", special: "Creatures of your choice within your Emanation" },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Font of Life",
        activityMatch: "Manifest Font of Life",
        options: {
          durationSeconds: 60,
          description: "Advantage on saving throws while within the magus's Font of Life Emanation.",
        },
        changes: [
          ...["str", "dex", "con", "int", "wis", "cha"].map((ability) =>
            DDBEnricherData.ChangeHelper.abilitySaveRollModeChange(ability, DDBEnricherData.ChangeHelper.ADVANTAGE),
          ),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Font of Life",
        max: "1",
        period: "lr",
      }),
    };
  }

}
