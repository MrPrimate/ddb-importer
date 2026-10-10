import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The save curses the target for 10 minutes; the psychic damage only lands whenever it lies, so
 * the save deals none and the damage is its own activity. DDB folds the damage into the save.
 */
export default class TruthsBlade extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Lie Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
          allowCritical: false,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Whenever the cursed creature lies",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 4,
              denomination: 8,
              types: ["psychic"],
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Truth's Blade",
        activityMatch: "Cast",
        options: {
          durationSeconds: 600,
          description: "The creature takes 4d8 Psychic damage (more if cast with a higher-level slot) whenever it lies.",
        },
      },
    ];
  }

}
