import DDBEnricherData from "../data/DDBEnricherData";

interface ITalismanConfig {
  damageType: string;
  /** names and dice of the touch damage activities, per ruleset */
  touch2014: [string, number][];
  touch2024: [string, number][];
  rebuke2024: string;
}

/**
 * The talismans burn the wrong sort of creature that touches them, and spend a charge to open a
 * fissure under one creature within 120 feet. The touch damage is its own activity, and the 2024
 * rebuke deals 4d6 Psychic whatever the save (a failed save destroys the target outright). The +2
 * spell attack bonus comes from DDB's own modifier effect.
 */
export default abstract class _Talisman extends DDBEnricherData {

  abstract config: ITalismanConfig;

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: this.is2014 ? "Fissure" : this.config.rebuke2024,
      addItemConsume: true,
      noTemplate: true,
      removeDamageParts: true,
      ...(this.is2014
        ? {}
        : { damageParts: [DDBEnricherData.basicDamagePart({ number: 4, denomination: 6, type: "psychic" })] }),
      data: {
        save: { ability: ["dex"], dc: { calculation: "", formula: "20" } },
        damage: { onSave: "full" },
        range: { override: true, value: "120", units: "ft", special: "you can see" },
        target: {
          override: true,
          affects: { type: "creature", count: "1", choice: false, special: "on the ground" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const touch = this.is2014 ? this.config.touch2014 : this.config.touch2024;
    return touch.map(([name, dice]) => ({
      init: { name, type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
      build: {
        generateActivation: true,
        activationOverride: { type: "special", value: null, condition: "Touching the talisman, and at the end of each turn holding or carrying it" },
        generateConsumption: false,
        generateDamage: true,
        damageParts: [DDBEnricherData.basicDamagePart({ number: dice, denomination: 6, type: this.config.damageType })],
        generateRange: true,
        rangeOverride: { units: "touch" },
        generateTarget: true,
        targetOverride: { affects: { type: "creature", count: "1" } },
        noeffect: true,
      },
    }));
  }

}
