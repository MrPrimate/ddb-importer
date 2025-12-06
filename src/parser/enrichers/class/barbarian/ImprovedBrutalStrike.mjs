/* eslint-disable class-methods-use-this */
import { DICTIONARY } from "../../../../config/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ImprovedBrutalStrike extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      name: "Brutal Strike Damage",
      itemConsumeTargetName: "Brutal Strike",
      addItemConsume: true,
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
        name: "Staggered: Opportunity Attacks",
        options: {
          description: `Can't make opportunity attacks.`,
        },
        activityMatch: "Staggering Blow",
        daeSpecialDurations: ["turnStartSource"],
      },
      {
        name: "Staggered: Saving Throws",
        changes: DICTIONARY.actor.abilities.map((ability) => DDBEnricherData.ChangeHelper.addChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, `system.abilities.${ability.value}.save.roll.mode`)),
        options: {
          description: `Disadvantage on next saving throw.`,
        },
        daeSpecialDurations: ["turnStartSource", "isSave"],
        activityMatch: "Staggering Blow",
      },
      {
        type: "enchant",
        name: `Sundering Blow Bonus`,
        options: {
          description: `A plus 5 bonus to hit the creature.`,
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("5", 20, "activities[attack].attack.bonus"),
        ],
        activityMatch: "Sundering Blow",
      },
    ];
  }

}
