import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Phantasmal Force: the save creates the phantasm; its damage lands on the believer each turn and a creature can Study it to see through it. DDB folds the damage into the save roll.
 */
export default class PhantasmalForce extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Phantasm Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Once per turn while the target believes the phantasm is real",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: this.is2014 ? 1 : 2,
              denomination: this.is2014 ? 6 : 8,
              types: ["psychic"],
            }),
          ],
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
      },
      {
        init: {
          name: "Study",
          type: DDBEnricherData.ACTIVITY_TYPES.CHECK,
        },
        build: {
          generateCheck: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
          checkOverride: {
            ability: "",
            associated: ["inv"],
            dc: { calculation: "spellcasting", formula: "" },
          },
          activationOverride: {
            type: "special",
            value: null,
            condition: "A creature takes the Study action to examine the illusion",
          },
          rangeOverride: { units: "any" },
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Seeing Phantasms",
        activityMatch: "Cast",
        options: {
          description: "The target believes the phantasm is real and rationalises any illogical outcomes; it can take the Study action to examine it with an Intelligence (Investigation) check against the spell save DC.",
        },
      },
    ];
  }

}
