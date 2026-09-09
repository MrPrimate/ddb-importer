import DDBEnricherData from "../../data/DDBEnricherData";

export default class DreadHand extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    if (this.isAction) return {};
    return {
      name: "Activate Dread Hand",
      targetType: "self",
      addItemConsume: true,
      activationType: "special",
      activationCondition: "When you take the Attack action on your turn",
      data: {
        duration: {
          value: "1",
          units: "minute",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Revenging Strike",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          noeffect: true,
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          generateRange: true,
          generateTarget: true,
          generateConsumption: false,
          activationOverride: {
            type: "reaction",
            value: 1,
            condition: "When you are hit by a melee attack by a creature within reach",
          },
          rangeOverride: {
            value: 5,
            units: "ft",
            special: "",
          },
          attackOverride: {
            ability: "str",
            type: {
              value: "melee",
              classification: "weapon",
            },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.pugilist.fisticuffs + @abilities.str.mod",
              types: ["bludgeoning"],
            }),
          ],
        },
      },
      {
        init: {
          name: "Unslakeable Bloodlust",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateTarget: true,
          generateUtility: true,
          generateConsumption: false,
          chatFlavor: "Roll the Unarmed Strike's damage dice twice and use either roll.",
          activationOverride: {
            type: "special",
            value: null,
            condition: "When you hit a target with an Unarmed Strike",
          },
        },
      },
      {
        init: {
          name: "Whirlwind of Violence",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateTarget: true,
          generateUtility: true,
          generateConsumption: false,
          chatFlavor: "Once per turn, reroll the missed attack and use the new result.",
          activationOverride: {
            type: "special",
            value: null,
            condition: "The first time you miss with an Unarmed Strike each turn",
          },
        },
        overrides: {
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Dread Hand",
        includesName: true,
        max: "1",
        period: "sr",
      }),
    };
  }

}
