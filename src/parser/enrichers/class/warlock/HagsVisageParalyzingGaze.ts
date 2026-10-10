import DDBEnricherData from "../../data/DDBEnricherData";

export default class HagsVisageParalyzingGaze extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  // DDB's action carries a Wisdom-based DC; the gaze uses the warlock's spell save DC
  override get activity(): IDDBActivityData {
    return {
      data: {
        save: {
          ability: ["wis"],
          dc: { calculation: "spellcasting", formula: "" },
        },
      },
    };
  }

  // a successful save is the one that hurts: Necrotic damage, and the creature is free of the gaze
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Paralyzing Gaze Resisted",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateDamage: true,
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "@classes.warlock.levels", types: ["necrotic"] })],
          activationOverride: { type: "special", value: 1, condition: "The creature succeeds on its save" },
        },
      },
    ];
  }


  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hag's Visage: Paralyzed",
        activityMatch: "Hag's Visage: Paralyzing Gaze",
        statuses: ["Paralyzed"],
        options: {
          description: "Paralyzed by the Hag's Visage Paralyzing Gaze (on a failed save only; on a success the creature takes Necrotic damage equal to the warlock's level instead).",
        },
      },
    ];
  }

}
