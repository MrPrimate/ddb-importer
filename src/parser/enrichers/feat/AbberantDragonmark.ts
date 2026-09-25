import Generic from "./Generic";
import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Aberrant Dragonmark. The 2014 Eberron feat spends Hit Dice for temporary hit points; the 2024
 * Forge of the Artificer printing instead adds Aberrant Fortitude (a d6 reaction bonus to a
 * failed Constitution save, once per long rest) and Aberrant Surge (spend the feat's use and a
 * Hit Die when casting its level 1 spell to deal force damage equal to the die).
 */
export default class AbberantDragonmark extends Generic {

  override get type(): IDDBActivityType | null {
    return this.is2024 ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : null;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.is2024) return null;
    return {
      name: "Aberrant Fortitude",
      activationType: "reaction",
      activationCondition: "When you fail a Constitution saving throw, add the roll to it",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      data: {
        roll: {
          formula: "1d6",
          name: "Bonus to Save",
          prompt: false,
          visible: true,
        },
      },
    };
  }

  override get override(): IDDBOverrideData | null {
    if (!this.is2024) return null;
    return {
      uses: this._getUsesWithSpent({
        type: "feat",
        name: this.ddbParser.originalName,
        max: "1",
        period: "lr",
      }),
    };
  }

  get surgeActivities(): IDDBAdditionalActivity[] {
    return [
      { label: "Largest Hit Die", target: "largest", formula: "@attributes.hd.largest" },
      { label: "Smallest Hit Die", target: "smallest", formula: "@attributes.hd.smallest" },
    ].map((surge) => ({
      init: {
        name: `Aberrant Surge (${surge.label})`,
        type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
      },
      build: {
        generateDamage: true,
        generateActivation: true,
        generateRange: true,
        generateTarget: true,
        generateConsumption: true,
        activationOverride: {
          type: "special",
          value: null,
          condition: "When you cast the level 1 spell from this feat, expend a Hit Die",
        },
        targetOverride: {
          affects: {
            count: "1",
            type: "creature",
            choice: false,
            special: "",
          },
        },
        damageParts: [
          DDBEnricherData.basicDamagePart({
            customFormula: surge.formula,
            types: ["force"],
          }),
        ],
      },
      overrides: {
        rangeType: "ft",
        rangeValue: 30,
        addItemConsume: true,
        additionalConsumptionTargets: [
          { type: "hitDice", target: surge.target, value: 1 },
        ],
      },
    }));
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2024) return this.surgeActivities;
    const characterClasses = this.ddbParser.isMuncher
      ? undefined
      : this.ddbParser.ddbCharacter?.source?.ddb?.character.classes;
    const hd = characterClasses
      ? characterClasses.map((klass) => klass.definition.hitDice)
      : [4, 6, 8, 10, 12];
    const activities = hd.map((die) => {
      return {
        init: {
          name: `Aberrant Surge: Spend HD (d${die})`,
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateDamage: false,
          generateHealing: true,
          generateRange: true,
          generateConsumption: true,
          healingPart: Generic.basicDamagePart({
            number: 1,
            denomination: die,
            type: "temphp",
          }),
          consumptionOverride: {
            spellSlot: false,
            scaling: {
              allowed: false,
            },
            targets: [
              {
                type: "hitDice",
                target: `d${die}`,
                value: 1,
                scaling: {
                  mode: "amount",
                  formula: "1",
                },
              },
            ],
          },
        },
      };
    });

    return activities;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }
}
