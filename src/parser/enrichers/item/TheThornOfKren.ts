import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The Thorn of Kren: +2 to attack and damage rolls with unarmed strikes and natural melee weapons
 * while attuned, and a Bite natural weapon that uses Strength or Dexterity. The Bite carries its own
 * +2; the bonus for other unarmed strikes and natural weapons needs AC5e, since dnd5e 5.x has no
 * roll bonus scoped to them. The parser keeps the attunement and frenzy saves and the
 * Perception/Survival advantage effect.
 */
export default class TheThornOfKren extends DDBEnricherData {

  // the Bite rolls the item's proficiency, and a wondrous item is otherwise never proficient
  override get override(): IDDBOverrideData {
    return {
      data: {
        "system.proficient": 1,
      },
    };
  }

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
              // Strength or Dexterity plus the natural weapon +2; not flat, so the actor's melee
              // attack bonuses still apply
              ability: "none",
              bonus: "max(@abilities.str.mod, @abilities.dex.mod) + 2",
              type: { value: "melee", classification: "unarmed" },
            },
            damage: {
              includeBase: false,
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 1,
                  denomination: 8,
                  bonus: "max(@abilities.str.mod, @abilities.dex.mod) + 2",
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
    // only AC5e can scope the bonus to unarmed strikes and natural weapons, so there is no plain
    // fallback; the scope leaves out this item, whose Bite already carries the +2
    const scope = "item.name.includes('Unarmed') || item.system.type.value === 'natural'";
    const helper = DDBEnricherData.ChangeHelper;
    return [
      {
        name: "Vicious Nature",
        ac5eOnly: true,
        options: {
          transfer: true,
          durationSeconds: null,
          expiry: null,
          description: "+2 to attack and damage rolls with unarmed strikes and natural melee weapons while attuned. Does not stack with bonuses from other magic items.",
        },
        ac5eChanges: [
          helper.ac5eChange(`bonus=2; ${scope}`, 20, "flags.automated-conditions-5e.attack.bonus"),
          helper.ac5eChange(`bonus=2; ${scope}`, 20, "flags.automated-conditions-5e.damage.bonus"),
        ],
      },
    ];
  }

}
