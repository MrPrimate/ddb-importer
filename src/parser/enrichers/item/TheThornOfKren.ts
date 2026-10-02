import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The Thorn of Kren: +2 to attack and damage rolls with unarmed strikes and natural melee weapons
 * while attuned (unarmed-only roll bonuses, the Demon Armor idiom), and a Bite natural weapon that
 * uses Strength or Dexterity. The parser keeps the attunement and frenzy saves and the
 * Perception/Survival advantage effect.
 */
export default class TheThornOfKren extends DDBEnricherData {

  // Bite sits beside the parsed attunement and frenzy saves rather than replacing them
  override get keepParsedActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Bite",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          activationOverride: { type: "action", value: 1, condition: "Or as a Bonus Action on each of your turns" },
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          noConsumeTargets: true,
          noeffect: true,
          rangeType: "ft",
          rangeValue: 5,
          data: {
            attack: {
              // Strength or Dexterity; the +2 arrives through the unarmed roll bonus below
              flat: true,
              bonus: "max(@abilities.str.mod, @abilities.dex.mod) + @prof",
              type: { value: "melee", classification: "unarmed" },
            },
            damage: {
              includeBase: false,
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 1,
                  denomination: 8,
                  bonus: "max(@abilities.str.mod, @abilities.dex.mod)",
                  types: ["piercing"],
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
        name: "Vicious Nature",
        changes: [
          DDBEnricherData.ChangeHelper.ruleBonusChange("attack", "2", {
            conditions: DDBEnricherData.ChangeHelper.UNARMED_FILTER,
          }),
          DDBEnricherData.ChangeHelper.ruleBonusChange("damage", "2", {
            conditions: DDBEnricherData.ChangeHelper.UNARMED_FILTER,
          }),
        ],
        options: {
          transfer: true,
          durationSeconds: null,
          expiry: null,
          description: "+2 to attack and damage rolls with unarmed strikes and natural melee weapons while attuned. Does not stack with bonuses from other magic items.",
        },
      },
    ];
  }

}
