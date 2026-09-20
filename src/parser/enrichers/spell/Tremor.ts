import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Nothing is rolled as the spell is cast. DDB gives the spell neither a template nor a save, so both
 * are restated: a 15-foot emanation on the caster, difficult terrain, and a Dexterity save from a
 * creature that enters it or ends its turn there, never the caster, as a free roll made by hand.
 */
export default class Tremor extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      // what the emanation does to a creature belongs to the free roll, not to the cast
      noeffect: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", type: "radius", size: "15", count: "1" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Ongoing Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: true,
          generateDamage: true,
          saveOverride: { ability: ["dex"], dc: { calculation: "spellcasting", formula: "" } },
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Enters the emanation or ends its turn there, or the emanation enters its space (once per turn)",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
        },
        overrides: {
          data: { range: { override: true, units: "spec" } },
        },
      },
    ];
  }

}
