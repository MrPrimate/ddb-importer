import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Ysgardian Spirit (Ysgardian Warrior, D&D Beyond Drops November 2026): on becoming Bloodied,
 * Advantage on the next attack roll before the end of your next turn, and a hit with it deals
 * extra damage equal to your Proficiency Bonus of the attack's own type. Once per Short or Long
 * Rest, which DDB's action already carries as the feat's uses.
 *
 * The extra damage is its own damage activity (the official Battle Master maneuver shape) rather
 * than a damage bonus on the effect: DAE's 1Attack and AC5e's once delete the effect at the attack
 * roll, before its damage is rolled.
 */
export default class YsgardianSpirit extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      activationCondition: "You become Bloodied",
      targetType: "self",
      data: {
        range: {
          override: true,
          value: null,
          units: "self",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Spirit Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateTarget: true,
          generateRange: false,
          generateConsumption: false,
          generateActivation: true,
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          activationCondition: "You hit with the attack made with Ysgardian Spirit's Advantage",
          noConsumeTargets: true,
          data: {
            damage: {
              onSave: "none",
              // "of the same type as the attack": every type, picked when rolled
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "@prof",
                  types: DDBEnricherData.allDamageTypes(),
                }),
              ],
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ysgardian Spirit: Advantage",
        activityMatch: "Ysgardian Spirit",
        options: {
          // "before the end of your next turn"
          expiry: "sourceEnd",
          description: "Advantage on your next attack roll before the end of your next turn. On a hit, roll the Spirit Damage activity for the extra damage. Without DAE or AC5e the effect lasts for every attack until the end of your next turn.",
        },
        // DAE and AC5e each end the effect after the one attack; the native expiry is the ceiling
        daeSpecialDurations: ["1Attack"],
        daeStackable: "noneName",
        changes: [
          DDBEnricherData.ChangeHelper.ruleAdvantageChange("attack"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("once; 1", 20, "flags.automated-conditions-5e.attack.advantage"),
        ],
      },
    ];
  }

}
