import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Demon Hunter (World of Warcraft: the Ranger option and the WoW Demon Hunter): the soul fragment pool
 * is Wis mod (minimum one) per Long Rest, plus one at level 13 and another at 17. DDB resolves the
 * count for the character's level only, so the maximum is a formula on the levels.
 *
 * DDB's option actions spend nothing and roll a scale value for Soul Cleave, so Soul Cleave (the
 * 10-foot save plus the Wis mod heal) and the Reaction that regains a fragment are built here
 * against the pool. Double Jump, Disrupt and Warglaive Mastery are the innate Feather Fall, Jump,
 * Counterspell and Throw Glaive spells DDB grants, which CONSUMPTION_SPELL_LINKS charges to the pool.
 */
export default class SoulFragments extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  // Soul Shatter raises Soul Cleave to 2d12
  get cleaveDice(): number {
    return this.hasClassFeature({ featureName: "Soul Shatter" }) ? 2 : 1;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Soul Cleave", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateSave: true,
          generateDamage: true,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "Once on each of your turns, in place of one attack of the Attack action",
          },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: { contiguous: false, type: "radius", size: "10", units: "ft" },
          },
          rangeOverride: { units: "self" },
          saveOverride: { ability: ["dex"], dc: { calculation: "spellcasting", formula: "" } },
          damageParts: [
            // a custom formula, or the level scale pass swaps in DDB's "Soul Fragments" dice scale and drops the modifier
            DDBEnricherData.basicDamagePart({ customFormula: `${this.cleaveDice}d12 + @abilities.wis.mod`, types: ["psychic"] }),
          ],
        },
        overrides: {
          addItemConsume: true,
        },
      },
      {
        init: { name: "Soul Cleave: Regain Hit Points", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateHealing: true,
          generateConsumption: false,
          activationOverride: { type: "special", value: 1, condition: "When a creature fails its save against Soul Cleave" },
          targetOverride: { override: true, affects: { type: "self" } },
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: "@abilities.wis.mod", types: ["healing"] }),
        },
      },
      {
        init: { name: "Regain Soul Fragment", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateConsumption: false,
          targetOverride: { override: true, affects: { type: "self" }, template: { contiguous: false, type: "", size: "", units: "" } },
          activationOverride: { type: "reaction", value: 1, condition: "When an enemy you can see within 30 feet of you dies" },
        },
        overrides: {
          addItemConsume: true,
          itemConsumeValue: -1,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    const levels = `@classes.${this.classIdentifier("Ranger")}.levels`;
    return {
      uses: {
        max: `max(1, @abilities.wis.mod) + min(2, floor(max(0, ${levels} - 9) / 4))`,
        recovery: [{ period: "lr", type: "recoverAll", formula: "" }],
      },
    };
  }

}
