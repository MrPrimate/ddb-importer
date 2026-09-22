import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Nothing is rolled as the spell is cast. The storm is up to ten joined 10-foot cubes with two
 * saves of its own: Dexterity against the lightning for a creature that enters or starts its turn
 * there, and Strength against the force for one that ends its turn there. Each is a free roll made
 * by hand and takes its own DDB damage part. The area is difficult terrain only for ferrous
 * creatures, which is left to the table.
 */
export default class ArcanomagneticStorm extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      // what the area does to a creature belongs to the free rolls, not to the cast
      noeffect: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { count: "10", contiguous: true, type: "cube", size: "10", units: "ft" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Lightning Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: true,
          generateDamage: true,
          partialDamageParts: [0],
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Starts its turn in the storm or enters it for the first time on its turn",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
        },
        overrides: {
          data: { range: { override: true, units: "spec" } },
        },
      },
      {
        init: { name: "Force Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: true,
          generateDamage: true,
          partialDamageParts: [1],
          saveOverride: { ability: ["str"], dc: { calculation: "spellcasting", formula: "" } },
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Ends its turn in the storm (Disadvantage if made of ferrous metal or wearing ferrous armour)",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
        },
        overrides: {
          data: { range: { override: true, units: "spec" } },
        },
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Prone",
        activityMatch: "Force Save",
        statuses: ["Prone"],
        options: { transfer: false },
      },
    ];
  }

}
