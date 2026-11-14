import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Great Old One Create Thrall (2024). Summon Aberration cast through this feature needs no
 * Concentration, lasts 1 minute and gives the thrall temporary Hit Points, so, as in the PHB, it is
 * a summon activity of its own: the creatures come from the character's Summon Aberration stat
 * block (SPELL_COMPANION_FEATURES_2024) and the summon's `tempHP` applies the temporary Hit Points
 * to the thrall. The PHB activity spends nothing; this one spends a Pact Magic slot, as the casting
 * would. dnd5e's spell slot consumption only reaches `spell1`-`spell9`, so the pact slot is spent as
 * an attribute, and the stat block reads its level from `@spells.pact.level`. The thrall's extra
 * Hex damage (the spell's 1d6, as Psychic) is the second activity. The 2014 feature (charming an
 * incapacitated humanoid) keeps the Hex damage and the temporary Hit Points activities it had.
 */
export default class CreateThrall extends DDBEnricherData {

  get tempHPFormula(): string {
    return `@abilities.cha.mod + @classes.${this.classIdentifier("Warlock")}.levels`;
  }

  get hexDamage(): IDDBActivityData {
    return {
      name: "Hex damage",
      targetType: "creature",
      activationType: "special",
      activationCondition: "1/turn. Thrall hits creature under your hex",
      damageParts: [
        DDBEnricherData.basicDamagePart({
          customFormula: "@abilities.cha.mod",
          types: ["psychic"],
        }),
      ],
    };
  }

  override get type(): IDDBActivityType | null {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.DAMAGE : DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get activity(): IDDBActivityData {
    if (this.is2014) return this.hexDamage;
    return {
      name: "Summon (No Concentration)",
      activationType: "action",
      noTemplate: true,
      data: {
        duration: {
          value: "1",
          units: "minute",
          concentration: false,
          override: true,
        },
        consumption: {
          targets: [
            {
              type: "attribute",
              value: "1",
              target: "spells.pact.value",
              scaling: { mode: "", formula: "" },
            },
          ],
          scaling: { allowed: false, max: "" },
          spellSlot: true,
        },
        tempHP: this.tempHPFormula,
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.is2014) {
      return [
        {
          init: {
            name: "Hex damage",
            type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
          },
          build: {
            generateConsumption: false,
            generateTarget: true,
            generateActivation: true,
            generateDamage: true,
            activationOverride: {
              type: "special",
              condition: "1/turn. Thrall hits creature under your hex",
            },
            targetOverride: {
              affects: {
                type: "creature",
              },
            },
            damageParts: [
              DDBEnricherData.basicDamagePart({
                number: 1,
                denomination: 6,
                types: ["psychic"],
              }),
            ],
          },
        },
      ];
    }
    return [
      {
        init: {
          name: "Thrall Temp HP",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateHealing: true,
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              type: "creature",
            },
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: this.tempHPFormula,
            types: ["temphp"],
          }),
        },
      },
    ];
  }

}
