import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The same shape as Wall of Fire: the wall rolls a save as it appears, as a straight wall or a
 * ring, then deals its damage with no save to a creature that enters it or ends its turn inside,
 * or ends its turn within 10 feet of the chosen side, a free roll made by hand.
 */
export default class WallOfDeath extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Place Wall",
      data: {
        target: {
          override: true,
          template: { type: "wall", size: "60", width: "1", height: "20", units: "ft" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Place Ring", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateDamage: true,
          generateConsumption: true,
          generateSave: true,
          generateTarget: true,
          targetOverride: {
            override: true,
            // "a ringed wall up to 20 feet in diameter, 20 feet high, and 1 foot thick"
            template: { count: "1", contiguous: false, type: "cylinder", size: "10", height: "20", units: "ft" },
            affects: {},
          },
        },
      },
      {
        init: { name: "Wall Damage", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: false,
          generateDamage: true,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Enters the wall for the first time on a turn or ends its turn there, or ends its turn within 10 feet of the chosen side",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
        },
        overrides: {
          data: { range: { override: true, units: "spec" } },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return { noTemplate: true };
  }

}
