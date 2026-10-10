import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Trapper: the augment chosen after a long rest retaliates when a nearby creature hits you in melee,
 * and Dissolve and Self-Destruct also burst when you drop to 0 hit points (once per long rest).
 * Every augment is built; the activation conditions name the one each belongs to.
 */
export default class BoobyTrap extends DDBEnricherData {

  static retaliate(name: string, number: number, denomination: number, damageType: string, condition: string): IDDBAdditionalActivity {
    return {
      init: { name, type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
      build: {
        generateConsumption: false,
        generateTarget: true,
        generateActivation: true,
        generateDamage: true,
        activationOverride: { type: "special", value: 1, condition },
        damageParts: [DDBEnricherData.basicDamagePart({ number, denomination, types: [damageType] })],
      },
      overrides: { targetType: "creature", noConsumeTargets: true, noTemplate: true },
    };
  }

  static burst(name: string, size: string, number: number, denomination: number, damageType: string, onSave: string, condition: string): IDDBAdditionalActivity {
    return {
      init: { name, type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
      build: {
        generateConsumption: false,
        generateTarget: true,
        generateActivation: true,
        generateSave: true,
        generateDamage: true,
        generateRange: true,
        activationOverride: { type: "special", value: 1, condition },
        damageParts: [DDBEnricherData.basicDamagePart({ number, denomination, types: [damageType] })],
      },
      overrides: {
        rangeSelf: true,
        noConsumeTargets: true,
        data: {
          save: { ability: ["dex"], dc: { calculation: "spellcasting", formula: "" } },
          damage: { onSave },
          target: {
            override: true,
            affects: { type: "creature" },
            template: { contiguous: false, type: "radius", size, units: "ft" },
          },
        },
      },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Defibrillate",
      targetType: "creature",
      activationType: "special",
      activationCondition: "Defibrillate: a creature hits you with a melee attack (it can't take reactions; you move up to 10 feet)",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      BoobyTrap.retaliate("Dissolve: Acid Spurt", 1, 6, "acid", "Dissolve: a creature within 5 feet hits you with a spell attack or natural weapon"),
      BoobyTrap.burst("Dissolve: Acid Burst", "10", 10, 4, "acid", "none", "Dissolve: you are reduced to 0 hit points"),
      BoobyTrap.retaliate("Entomb: Cold Ripple", 1, 4, "cold", "Entomb: a creature within 5 feet hits you with a melee attack"),
      BoobyTrap.retaliate("Self-Destruct: Shaped Charge", 1, 8, "fire", "Self-Destruct: a creature within 5 feet hits you with a melee attack (you take 1 Fire damage)"),
      BoobyTrap.burst("Self-Destruct: Eruption", "20", 14, 6, "fire", "half", "Self-Destruct: you are reduced to 0 hit points (you fail one death saving throw)"),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Acid Coated",
        activityMatch: "Dissolve: Acid Burst",
        options: {
          durationSeconds: 60,
          description: "Takes 5d4 Acid damage at the start of each of its turns until it uses an action to wipe itself clean. On a natural 1 in nonmagical ferrous armour, the armour seizes: speed halved, AC -2, Disadvantage on Dexterity saving throws.",
        },
      },
      {
        name: "Entombing Cold",
        activityMatch: "Entomb: Cold Ripple",
        options: {
          durationSeconds: 6,
          description: "Speed reduced by 15 feet until the end of its next turn, unless immune to Cold damage.",
        },
        changes: [DDBEnricherData.ChangeHelper.movementBonusChange("-15")],
      },
    ];
  }

}
