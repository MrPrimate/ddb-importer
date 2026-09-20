import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Prismatic Spray: the indigo and violet rays call for follow-up saves at the end of the target's turns; the parser already applies the Restrained and Blinded riders.
 */
export default class PrismaticSpray extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Indigo Save (Con)",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateSave: true,
          generateDamage: false,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "At the end of each of the Restrained target's turns; three successes end it, three failures petrify",
          },
          saveOverride: {
            ability: ["con"],
            dc: { calculation: "spellcasting", formula: "" },
          },
          rangeOverride: { units: "any" },
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
      },
      {
        init: {
          name: "Violet Save (Wis)",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateSave: true,
          generateDamage: false,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "At the end of the Blinded target's next turn; failure sends it to another plane",
          },
          saveOverride: {
            ability: ["wis"],
            dc: { calculation: "spellcasting", formula: "" },
          },
          rangeOverride: { units: "any" },
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
      },
    ];
  }

}
