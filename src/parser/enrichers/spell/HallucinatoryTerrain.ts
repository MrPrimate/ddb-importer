import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Hallucinatory Terrain: the 150-foot cube illusion plus the Study check a creature makes to see through it.
 */
export default class HallucinatoryTerrain extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        target: {
          template: { type: "cube", size: "150", units: "ft", count: "" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
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

}
