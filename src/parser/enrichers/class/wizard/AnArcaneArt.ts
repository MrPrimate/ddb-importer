import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Origami Mage: DDB's Create Origami Construct keeps the use. The constructs that roll something get
 * their own activities: the cat's melee spell attack (d6 rising to d8, d10 and d12 at wizard levels 5,
 * 11 and 17), the bird's extra 2 slashing on ranged hits, and the dragon's 1d4 fire each turn and
 * 2d6 burst when destroyed.
 */
export default class AnArcaneArt extends DDBEnricherData {

  static CAT_DIE = "1d(6 + 2 * min(1, floor(@classes.wizard.levels / 5)) + 2 * min(1, floor(@classes.wizard.levels / 11)) + 2 * min(1, floor(@classes.wizard.levels / 17)))";

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  static damage(name: string, part: I5eDamagePart, condition: string, self = false): IDDBAdditionalActivity {
    return {
      init: { name, type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
      build: {
        generateConsumption: false,
        generateTarget: true,
        generateActivation: true,
        generateDamage: true,
        activationOverride: { type: "special", value: 1, condition },
        damageParts: [part],
      },
      overrides: self
        ? { targetSelf: true, noConsumeTargets: true, noTemplate: true }
        : { targetType: "creature", noConsumeTargets: true, noTemplate: true },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: { name: "Origami Cat", type: DDBEnricherData.ACTIVITY_TYPES.ATTACK },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateAttack: true,
          generateDamage: true,
          activationOverride: { type: "special", value: 1, condition: "Once on each of your turns, you hit a target with a melee weapon attack (uses your weapon attack modifier)" },
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: AnArcaneArt.CAT_DIE, types: ["slashing"] })],
        },
        overrides: {
          targetType: "creature",
          noConsumeTargets: true,
          data: {
            attack: { type: { value: "melee", classification: "spell" } },
            range: { units: "ft", value: "5" },
          },
        },
      },
      AnArcaneArt.damage("Origami Bird", DDBEnricherData.basicDamagePart({ customFormula: "2", types: ["slashing"] }), "You hit a target with a ranged attack"),
      AnArcaneArt.damage("Origami Dragon: Heat", DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["fire"] }), "Start of each of your turns while an origami dragon is bound to you", true),
      {
        init: { name: "Origami Dragon: Burst", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateDamage: true,
          generateRange: true,
          activationOverride: { type: "special", value: 1, condition: "A bound origami dragon is destroyed" },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["fire"] })],
        },
        overrides: {
          noConsumeTargets: true,
          data: {
            target: {
              override: true,
              affects: { type: "creature" },
              template: { contiguous: false, type: "radius", size: "5", units: "ft" },
            },
          },
        },
      },
    ];
  }

}
