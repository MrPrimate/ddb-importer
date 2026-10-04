import DDBEnricherData from "../../data/DDBEnricherData";

/** The Coven Hag's Visage: Death Gaze, a Wisdom save with Advantage against the warlock's spell save DC or drop to 0 Hit Points. */
export default class HagsVisageDeathGaze extends DDBEnricherData {

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
          name: "Death Gaze Resisted",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateDamage: true,
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "2 * @classes.warlock.levels", types: ["necrotic"] })],
          activationOverride: { type: "special", value: 1, condition: "The creature succeeds on its save" },
        },
      },
    ];
  }

}
