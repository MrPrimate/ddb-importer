import { DICTIONARY } from "../../../../config/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class ImprovedBrutalStrike extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
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

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Staggering Blow",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
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
        init: {
          name: "Sundering Blow",
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
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

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Staggered: Opportunity Attacks",
        options: {
          description: `Can't make opportunity attacks.`,
        },
        activityMatch: "Staggering Blow",
        daeSpecialDurations: ["turnStartSource" as const],
      },
      {
        name: "Staggered: Saving Throws",
        changes: DICTIONARY.actor.abilities.map((ability) => DDBEnricherData.ChangeHelper.addChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, `system.abilities.${ability.value}.save.roll.mode`)),
        options: {
          description: `Disadvantage on next saving throw.`,
        },
        daeSpecialDurations: ["turnStartSource" as const, "isSave" as const],
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
