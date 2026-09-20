import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Forcecage: the cage and the solid box are the two shapes; the parser keeps the Charisma save for teleporting out.
 */
export default class Forcecage extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Create Cage",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
          generateUtility: true,
          activationOverride: {
            type: "action",
            value: null,
            condition: "20-foot cube of bars",
          },
          targetOverride: {
            template: { type: "cube", size: "20", units: "ft", count: "" },
            affects: { count: "", type: "creature", choice: false, special: "" },
          },
        },
      },
      {
        init: {
          name: "Create Solid Box",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
          generateUtility: true,
          activationOverride: {
            type: "action",
            value: null,
            condition: "10-foot cube of solid force",
          },
          targetOverride: {
            template: { type: "cube", size: "10", units: "ft", count: "" },
            affects: { count: "", type: "creature", choice: false, special: "" },
          },
        },
      },
    ];
  }

}
