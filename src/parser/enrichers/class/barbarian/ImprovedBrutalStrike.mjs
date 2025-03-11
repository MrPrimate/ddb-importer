/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ImprovedBrutalStrike extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      name: "Brutal Strike Damage",
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ customFormula: "@scale.barbarian.brutal-strike" })],
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Staggering Blow",
          type: "utility",
        },
        build: {
          generateActivation: true,
          generateDamage: false,
        },
        overrides: {
          targetType: "creature",
        },
      },
      {
        constructor: {
          name: "Sundering Blow",
          type: "enchant",
        },
        build: {
          generateActivation: true,
          generateDamage: false,
        },
        overrides: {
          data: {
            restrictions: {
              allowMagical: true,
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Staggered",
        changes: [],
        options: {
          description: `Disadvantage on next saving throws and can't make opportunity attacks.`,
        },
        activityMatch: "Staggering Blow",
      },
      {
        name: "Sundering Blow",
        changes: [
          {
            type: "enchant",
            name: `Sundering Blow Bonus`,
            options: {
              description: `A plus 5 bonus to hit the creature.`,
            },
            changes: [
              DDBEnricherData.ChangeHelper.addChange("5", 20, "activities[attack].attack.bonus"),
            ],
          },
        ],
        activityMatch: "Sundering Blow",
      },
    ];
  }

}
