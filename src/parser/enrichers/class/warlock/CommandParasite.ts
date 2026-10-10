import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Parasite Patron Larval Regeneration: the parasite you control after death. Burrowing Possession is
 * a Strength or Dexterity save (your choice) against your spell save DC for Piercing damage equal to
 * your Warlock level; a creature still hosting it at the end of its turn takes twice that as Necrotic.
 */
export default class CommandParasite extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Burrowing Possession",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateSave: true,
          generateDamage: true,
          saveOverride: { ability: ["str", "dex"], dc: { calculation: "spellcasting", formula: "" } },
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "@classes.warlock.levels", types: ["piercing"] })],
          activationOverride: { type: "action", value: 1, condition: "The parasite targets a Humanoid within 5 feet" },
        },
        overrides: {
          targetType: "creature",
          targetCount: 1,
          noTemplate: true,
          data: { damage: { onSave: "none" } },
        },
      },
      {
        init: {
          name: "Burrowed: End of Turn",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateDamage: true,
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "2 * @classes.warlock.levels", types: ["necrotic"] })],
          activationOverride: {
            type: "special",
            value: 1,
            condition: "The parasite is burrowed inside the creature when its turn ends (it can eject the parasite with a Constitution save as an action)",
          },
        },
        overrides: {
          targetType: "creature",
          targetCount: 1,
          noTemplate: true,
        },
      },
    ];
  }

}
